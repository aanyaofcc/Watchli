import * as cheerio from "cheerio";
import crypto from "crypto";

const PRICE_REGEX = /(?:\$|USD\s?)(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?/gi;

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function firstText(value) {
  return typeof value === "string" ? normalizeWhitespace(value) : "";
}

function normalizeCurrency(currency, raw = "") {
  const trimmed = (currency || "").trim().toUpperCase();

  if (trimmed) {
    return trimmed;
  }

  if (raw.includes("$") || raw.toUpperCase().includes("USD")) {
    return "USD";
  }

  return "";
}

function parseNumericPrice(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }

  const normalized = String(raw).replace(/[^0-9.,-]/g, "").trim();

  if (!normalized) {
    return null;
  }

  const decimalNormalized = normalized.includes(".")
    ? normalized.replace(/,/g, "")
    : normalized.replace(/,/g, ".");
  const value = Number(decimalNormalized);

  if (!Number.isFinite(value) || value <= 0 || value > 1000000) {
    return null;
  }

  return Number(value.toFixed(2));
}

function formatPrice(value, currency, fallbackRaw = "") {
  if (!Number.isFinite(value)) {
    return normalizeWhitespace(fallbackRaw);
  }

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  return currency ? `${currency} ${value.toFixed(2)}` : `$${value.toFixed(2)}`;
}

function makePriceCandidate({
  value,
  currency = "",
  raw = "",
  source,
  score,
  productTitle = ""
}) {
  const numericValue = parseNumericPrice(value ?? raw);

  if (!numericValue) {
    return null;
  }

  const resolvedCurrency = normalizeCurrency(currency, String(raw || value || ""));

  return {
    value: numericValue,
    currency: resolvedCurrency,
    display: formatPrice(numericValue, resolvedCurrency, String(raw || value || "")),
    raw: normalizeWhitespace(String(raw || value || "")),
    source,
    score,
    productTitle: firstText(productTitle)
  };
}

function readText($, element) {
  return normalizeWhitespace($(element).text() || $(element).attr("content") || "");
}

function collectJsonLdCandidates(node, candidates, inheritedTitle = "") {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((entry) => collectJsonLdCandidates(entry, candidates, inheritedTitle));
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const productTitle = firstText(node.name || inheritedTitle);
  const offers = [
    ...toArray(node.offers),
    ...toArray(node.priceSpecification),
    ...(node.aggregateRating ? [] : [])
  ];
  const directCandidate = makePriceCandidate({
    value: node.price ?? node.lowPrice,
    currency: node.priceCurrency,
    raw: node.price ?? node.lowPrice ?? "",
    source: "structured data",
    score: node.price ? 100 : 94,
    productTitle
  });

  if (directCandidate) {
    candidates.push(directCandidate);
  }

  offers.forEach((offer) => {
    const candidate = makePriceCandidate({
      value: offer?.price ?? offer?.lowPrice,
      currency: offer?.priceCurrency ?? node.priceCurrency,
      raw: offer?.price ?? offer?.lowPrice ?? "",
      source: "structured data",
      score: offer?.price ? 100 : 92,
      productTitle: firstText(offer?.name || productTitle)
    });

    if (candidate) {
      candidates.push(candidate);
    }
  });

  Object.values(node).forEach((value) => {
    if (typeof value === "object") {
      collectJsonLdCandidates(value, candidates, productTitle);
    }
  });
}

function collectMetaCandidates($, candidates) {
  const selectors = [
    ["meta[property='product:price:amount']", "meta product price", 98],
    ["meta[property='product:sale_price:amount']", "meta sale price", 97],
    ["meta[property='og:price:amount']", "meta og price", 95],
    ["meta[itemprop='price']", "itemprop meta", 96],
    ["[itemprop='price']", "itemprop price", 94]
  ];

  selectors.forEach(([selector, source, score]) => {
    $(selector).each((_, element) => {
      const content = $(element).attr("content") || readText($, element);
      const currency =
        $(element).attr("currency") ||
        $(element).attr("data-currency") ||
        $("meta[property='product:price:currency']").attr("content") ||
        $("meta[itemprop='priceCurrency']").attr("content") ||
        "";
      const candidate = makePriceCandidate({
        value: content,
        currency,
        raw: content,
        source,
        score,
        productTitle: $("meta[property='og:title']").attr("content") || $("title").text()
      });

      if (candidate) {
        candidates.push(candidate);
      }
    });
  });
}

function collectSelectorCandidates($, candidates) {
  const selectors = [
    [".price", 75],
    [".product-price", 83],
    [".sale-price", 84],
    [".current-price", 85],
    [".our-price", 82],
    ["[data-price]", 80],
    ["[class*='price']", 68],
    ["[id*='price']", 66]
  ];
  const pageTitle = $("meta[property='og:title']").attr("content") || $("title").text();

  selectors.forEach(([selector, baseScore]) => {
    $(selector).slice(0, 20).each((_, element) => {
      const text = readText($, element);
      const match = text.match(PRICE_REGEX)?.[0] || $(element).attr("data-price") || "";
      const className = ($(element).attr("class") || "").toLowerCase();
      let score = baseScore;

      if (className.includes("old") || className.includes("compare") || className.includes("original") || className.includes("was")) {
        score -= 18;
      }

      if (className.includes("sale") || className.includes("current") || className.includes("final")) {
        score += 8;
      }

      const candidate = makePriceCandidate({
        value: match,
        raw: match || text,
        source: "page selector",
        score,
        productTitle: pageTitle
      });

      if (candidate) {
        candidates.push(candidate);
      }
    });
  });
}

function dedupeCandidates(candidates) {
  const byKey = new Map();

  candidates.forEach((candidate) => {
    const key = `${candidate.currency}:${candidate.value.toFixed(2)}`;
    const existing = byKey.get(key);

    if (!existing || candidate.score > existing.score) {
      byKey.set(key, candidate);
    }
  });

  return [...byKey.values()].sort((left, right) => right.score - left.score);
}

export function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function extractPageText(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const text = $("body").text() || $.root().text() || "";
  return normalizeWhitespace(text);
}

export function extractProductSignals(html) {
  const $ = cheerio.load(html);
  const candidates = [];
  const productTitle =
    firstText($("meta[property='og:title']").attr("content")) ||
    firstText($("title").text());

  $("script[type='application/ld+json']").each((_, element) => {
    const parsed = safeJsonParse($(element).contents().text());
    collectJsonLdCandidates(parsed, candidates, productTitle);
  });

  collectMetaCandidates($, candidates);
  collectSelectorCandidates($, candidates);

  const uniqueCandidates = dedupeCandidates(candidates);
  const primaryCandidate = uniqueCandidates[0] || null;

  return {
    productTitle: primaryCandidate?.productTitle || productTitle,
    priceDetected: Boolean(primaryCandidate),
    primaryPrice: primaryCandidate?.display || "",
    primaryPriceValue: primaryCandidate?.value ?? null,
    primaryPriceCurrency: primaryCandidate?.currency || "",
    primaryPriceSource: primaryCandidate?.source || "",
    primaryPriceConfidence: primaryCandidate?.score || 0,
    detectedPrices: uniqueCandidates.slice(0, 5).map((candidate) => candidate.display)
  };
}

export function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
