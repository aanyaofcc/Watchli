import * as cheerio from "cheerio";
import crypto from "crypto";

const PRICE_REGEX =
  /(?:\$|USD\s?|US\$\s?|CAD\s?|CA\$\s?|AUD\s?|A\$\s?|EUR\s?|€\s?|GBP\s?|£\s?)(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?|\b(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?\s?(?:USD|CAD|AUD|EUR|GBP)\b/gi;
const CURRENCY_SYMBOL_TO_CODE = {
  "$": "USD",
  "US$": "USD",
  "CA$": "CAD",
  "A$": "AUD",
  "€": "EUR",
  "£": "GBP"
};
const SOLD_OUT_PATTERNS = [
  /\bsold\s*out\b/i,
  /\bout\s*of\s*stock\b/i,
  /\bcurrently\s*unavailable\b/i,
  /\btemporarily\s*out\s*of\s*stock\b/i,
  /\bsoldout\b/i,
  /\bnot\s*available\s*for\s*pickup\b/i,
  /\bnot\s*available\s*for\s*delivery\b/i,
  /\bback\s*soon\b/i,
  /\bcoming\s*soon\b/i,
  /\bjoin\s*waitlist\b/i,
  /\bjoin\s*the\s*waitlist\b/i,
  /\bwaitlist\b/i,
  /\bnotify\s*me\s*when\s*available\b/i,
  /\bemail\s*me\s*when\s*available\b/i
];
const UNAVAILABLE_PATTERNS = [
  /\bno\s*longer\s*available\b/i,
  /\bitem\s*unavailable\b/i,
  /\bproduct\s*unavailable\b/i,
  /\bunavailable\b/i,
  /\bdiscontinued\b/i,
  /\bitem\s*is\s*no\s*longer\s*available\b/i,
  /\bpage\s*not\s*found\b/i,
  /\b404\b/i,
  /\bremoved\b/i,
  /\bhas\s*been\s*retired\b/i
];
const POSITIVE_AVAILABILITY_PATTERNS = [
  /\bin\s*stock\b/i,
  /\binstock\b/i,
  /\bavailable\s*now\b/i,
  /\bready\s*to\s*ship\b/i,
  /\bships\s*now\b/i,
  /\badd\s*to\s*cart\b/i,
  /\badd\s*to\s*bag\b/i,
  /\badd\s*bag\b/i,
  /\bpick\s*up\s*today\b/i,
  /\bbuy\s*now\b/i
];
const NEGATIVE_PRICE_CONTEXT = [
  "old",
  "compare",
  "comparison",
  "list",
  "original",
  "regular",
  "retail",
  "msrp",
  "save",
  "saving",
  "per month",
  "monthly",
  "installment",
  "afterpay",
  "klarna",
  "was",
  "before",
  "starting at",
  "from",
  "as low as",
  "or 4 payments",
  "pay in 4",
  "interest free",
  "save up to",
  "off",
  "discount"
];
const POSITIVE_PRICE_CONTEXT = [
  "price",
  "sale",
  "current",
  "now",
  "our",
  "special",
  "deal",
  "final",
  "member",
  "purchase",
  "buy",
  "cart",
  "your price",
  "sale price",
  "now",
  "today",
  "checkout",
  "bag",
  "add to cart",
  "add to bag"
];
const HARD_NEGATIVE_PRICE_CONTEXT_REGEX =
  /\b(?:save|saving|discount|coupon|promo code|with code|or 4 payments|or 3 payments|pay in 4|pay in 3|per month|monthly|installment|afterpay|klarna|affirm|zip|interest free|reward|rewards|points|cashback)\b/i;

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

function toAbsoluteUrl(value, baseUrl = "") {
  const raw = firstText(value);

  if (!raw || raw.startsWith("data:")) {
    return "";
  }

  try {
    return new URL(raw, baseUrl || undefined).toString();
  } catch (_error) {
    return "";
  }
}

function firstSrcFromSrcSet(srcSet, baseUrl = "") {
  const firstEntry = String(srcSet || "")
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .find(Boolean);

  return toAbsoluteUrl(firstEntry, baseUrl);
}

function scoreImageCandidate(candidate, productTitle = "") {
  const url = String(candidate?.url || "").toLowerCase();
  const alt = String(candidate?.alt || "").toLowerCase();
  const title = String(productTitle || "").toLowerCase();
  let score = Number(candidate?.score || 0);

  if (!url) {
    return -1;
  }

  if (/logo|icon|sprite|avatar|placeholder|spacer|tracking|pixel/.test(url)) {
    score -= 40;
  }

  if (/logo|icon|placeholder/.test(alt)) {
    score -= 30;
  }

  if (/product|products|item|items|gallery|hero|primary/.test(url)) {
    score += 8;
  }

  if (title) {
    const significantWords = title
      .split(/\s+/)
      .filter((word) => word.length >= 4)
      .slice(0, 4);

    if (significantWords.some((word) => url.includes(word) || alt.includes(word))) {
      score += 10;
    }
  }

  return score;
}

function addImageCandidate(candidates, value, source, score, baseUrl = "", alt = "") {
  const url =
    typeof value === "object" && value
      ? toAbsoluteUrl(value.url || value.contentUrl || value.thumbnailUrl || value.src, baseUrl)
      : toAbsoluteUrl(value, baseUrl);

  if (!url) {
    return;
  }

  candidates.push({
    url,
    source,
    score,
    alt: firstText(alt)
  });
}

function collectJsonLdImageCandidates(node, candidates, baseUrl = "") {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((entry) => collectJsonLdImageCandidates(entry, candidates, baseUrl));
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const objectType = normalizeWhitespace(
    [...toArray(node["@type"]), ...toArray(node.type)].join(" ")
  ).toLowerCase();

  if (objectType.includes("product") || node.image || node.thumbnailUrl) {
    toArray(node.image).forEach((value) => {
      addImageCandidate(candidates, value, "structured data", objectType.includes("product") ? 98 : 92, baseUrl, node.name);
    });
    toArray(node.thumbnailUrl).forEach((value) => {
      addImageCandidate(candidates, value, "structured data thumbnail", 90, baseUrl, node.name);
    });
  }

  Object.values(node).forEach((value) => {
    if (typeof value === "object") {
      collectJsonLdImageCandidates(value, candidates, baseUrl);
    }
  });
}

function collectMetaImageCandidates($, candidates, baseUrl = "") {
  [
    ["meta[property='og:image']", "og:image", 100],
    ["meta[property='og:image:url']", "og:image", 99],
    ["meta[name='twitter:image']", "twitter:image", 96],
    ["meta[name='twitter:image:src']", "twitter:image", 95],
    ["meta[itemprop='image']", "itemprop image", 94]
  ].forEach(([selector, source, score]) => {
    $(selector).each((_, element) => {
      addImageCandidate(candidates, $(element).attr("content"), source, score, baseUrl);
    });
  });
}

function collectDomImageCandidates($, candidates, baseUrl = "", productTitle = "") {
  const selectors = [
    "main img",
    "[class*='product' i] img",
    "[id*='product' i] img",
    "[class*='gallery' i] img",
    "img"
  ];

  selectors.forEach((selector, selectorIndex) => {
    $(selector)
      .slice(0, selector === "img" ? 12 : 8)
      .each((index, element) => {
        const src =
          $(element).attr("src") ||
          $(element).attr("data-src") ||
          $(element).attr("data-original") ||
          firstSrcFromSrcSet($(element).attr("srcset"), baseUrl);
        const context = `${$(element).attr("class") || ""} ${$(element).attr("id") || ""} ${
          $(element).closest("[class],[id]").attr("class") || ""
        }`;
        const baseScore = selectorIndex === 0 ? 88 : selectorIndex === 1 ? 86 : selectorIndex === 2 ? 84 : 76;
        const contextualBoost = /product|gallery|hero|media|image/i.test(context) ? 6 : 0;
        const titleBoost =
          productTitle && firstText($(element).attr("alt")).toLowerCase().includes(productTitle.toLowerCase().split(" ")[0])
            ? 4
            : 0;

        addImageCandidate(
          candidates,
          src,
          "page image",
          baseScore - index + contextualBoost + titleBoost,
          baseUrl,
          $(element).attr("alt")
        );
      });
  });
}

function selectPrimaryImage(candidates, productTitle = "") {
  const deduped = new Map();

  candidates.forEach((candidate) => {
    if (!candidate?.url) {
      return;
    }

    const existing = deduped.get(candidate.url);
    const scoredCandidate = {
      ...candidate,
      score: scoreImageCandidate(candidate, productTitle)
    };

    if (!existing || scoredCandidate.score > existing.score) {
      deduped.set(candidate.url, scoredCandidate);
    }
  });

  return [...deduped.values()].sort((left, right) => right.score - left.score)[0] || null;
}

function normalizeCurrency(currency, raw = "") {
  const trimmed = (currency || "").trim().toUpperCase();

  if (trimmed) {
    return trimmed;
  }

  const normalizedRaw = String(raw || "").trim();

  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOL_TO_CODE)) {
    if (normalizedRaw.includes(symbol)) {
      return code;
    }
  }

  if (normalizedRaw.toUpperCase().includes("USD")) {
    return "USD";
  }

  if (normalizedRaw.toUpperCase().includes("CAD")) {
    return "CAD";
  }

  if (normalizedRaw.toUpperCase().includes("AUD")) {
    return "AUD";
  }

  if (normalizedRaw.toUpperCase().includes("EUR")) {
    return "EUR";
  }

  if (normalizedRaw.toUpperCase().includes("GBP")) {
    return "GBP";
  }

  if (normalizedRaw.includes("€")) {
    return "EUR";
  }

  if (normalizedRaw.includes("£")) {
    return "GBP";
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

  const commaCount = (normalized.match(/,/g) || []).length;
  const dotCount = (normalized.match(/\./g) || []).length;
  let decimalNormalized = normalized;

  if (commaCount > 0 && dotCount > 0) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      decimalNormalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      decimalNormalized = normalized.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    const parts = normalized.split(",");
    const lastPart = parts[parts.length - 1] || "";

    if (parts.length > 2 || lastPart.length === 3) {
      decimalNormalized = normalized.replace(/,/g, "");
    } else {
      decimalNormalized = normalized.replace(",", ".");
    }
  } else if (dotCount > 1) {
    const parts = normalized.split(".");
    const lastPart = parts.pop() || "";
    decimalNormalized = `${parts.join("")}.${lastPart}`;
  }

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

  if (currency) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency
      }).format(value);
    } catch (_error) {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  return `$${value.toFixed(2)}`;
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

function readOwnText($, element) {
  return normalizeWhitespace(
    $(element)
      .contents()
      .filter((_, node) => node.type === "text")
      .text() || ""
  );
}

function buildCombinedPriceFromParts(whole, fraction = "", currency = "") {
  const normalizedWhole = String(whole || "").replace(/[^\d,-]/g, "").trim();
  const normalizedFraction = String(fraction || "").replace(/[^\d]/g, "").trim();

  if (!normalizedWhole) {
    return "";
  }

  let combined = normalizedWhole;

  if (normalizedFraction) {
    combined = `${normalizedWhole}.${normalizedFraction.slice(0, 2).padEnd(2, "0")}`;
  }

  return `${currency || ""}${combined}`.trim();
}

function readSplitPrice(element, $) {
  const root = $(element);
  const wholeSelectors = [
    "[class*='price-whole' i]",
    "[class*='whole' i]",
    "[data-price-whole]",
    "[data-testid*='whole' i]"
  ];
  const fractionSelectors = [
    "[class*='price-fraction' i]",
    "[class*='fraction' i]",
    "[class*='decimal' i]",
    "[data-price-fraction]",
    "[data-testid*='fraction' i]",
    "sup"
  ];
  const currencySelectors = [
    "[class*='currency' i]",
    "[data-currency]",
    "[data-testid*='currency' i]"
  ];
  const hasWholeSelector = wholeSelectors.some((selector) => root.find(selector).length > 0);
  const hasFractionSelector = fractionSelectors.some((selector) => root.find(selector).length > 0);
  const hasSplitStructure = hasWholeSelector || hasFractionSelector;

  if (!hasSplitStructure) {
    return "";
  }

  const whole =
    wholeSelectors
      .map((selector) => firstText(root.find(selector).first().text()))
      .find(Boolean) ||
    firstText(readOwnText($, element));
  const fraction =
    fractionSelectors
      .map((selector) => firstText(root.find(selector).first().text()))
      .find(Boolean) || "";
  const currency =
    currencySelectors
      .map((selector) => firstText(root.find(selector).first().text()))
      .find(Boolean) || "";

  const combined = buildCombinedPriceFromParts(whole, fraction, currency);

  if (parseNumericPrice(combined) !== null) {
    return combined;
  }

  return "";
}

function isPriceFragmentElement(element, $) {
  const tagName = String(element?.tagName || element?.name || "").toLowerCase();
  const className = ($(element).attr("class") || "").toLowerCase();
  const id = ($(element).attr("id") || "").toLowerCase();
  const dataTestId = ($(element).attr("data-testid") || "").toLowerCase();
  const text = readText($, element);
  const context = `${className} ${id} ${dataTestId}`;

  if (tagName === "sup" && /^\d{1,2}$/.test(text)) {
    return true;
  }

  if (!/\b(?:fraction|decimal|cents|cent|whole)\b/i.test(context)) {
    return false;
  }

  return text.length <= 6;
}

function scoreContext(text = "", startingScore = 0) {
  const normalized = String(text || "").toLowerCase();
  let score = startingScore;

  POSITIVE_PRICE_CONTEXT.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score += 4;
    }
  });

  NEGATIVE_PRICE_CONTEXT.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score -= 7;
    }
  });

  return score;
}

function findPriceLikeMatch(text) {
  if (!text) {
    return "";
  }

  return text.match(PRICE_REGEX)?.[0] || "";
}

function findAllPriceLikeMatches(text) {
  if (!text) {
    return [];
  }

  return [...String(text).matchAll(PRICE_REGEX)].map((match) => ({
    value: match[0],
    index: match.index || 0
  }));
}

function findCurrencySymbolPrice(text) {
  if (!text) {
    return "";
  }

  return text.match(/[€£]\s?(?:\d{1,3}(?:[.,]\d{3})*|\d+)(?:[.,]\d{2})?/i)?.[0] || "";
}

function findNumericOnlyPrice(text, { maxWordCount = 4 } = {}) {
  const normalized = normalizeWhitespace(text || "");

  if (!normalized) {
    return "";
  }

  if (normalized.includes("%")) {
    return "";
  }

  if (normalized.split(/\s+/).length > maxWordCount) {
    return "";
  }

  return parseNumericPrice(normalized) !== null ? normalized : "";
}

function readAttributePrice(element, $) {
  const attributeKeys = [
    "data-price",
    "data-price-amount",
    "data-price-string",
    "data-product-price",
    "data-sale-price",
    "data-current-price",
    "data-final-price",
    "data-regular-price",
    "data-sale-price-amount",
    "data-current-price-amount",
    "data-final-price-amount",
    "data-price-value",
    "data-amount",
    "data-value",
    "data-qa",
    "data-testid",
    "data-test",
    "content",
    "value",
    "aria-label"
  ];

  for (const key of attributeKeys) {
    const value = $(element).attr(key);

    if (!value) {
      continue;
    }

    const matched = findPriceLikeMatch(value);

    if (matched) {
      return matched;
    }

    if (parseNumericPrice(value) !== null) {
      return value;
    }
  }

  return "";
}

function readBestPriceText(element, $) {
  return (
    readAttributePrice(element, $) ||
    readSplitPrice(element, $) ||
    readText($, element)
  );
}

function buildCandidatesFromText({
  text,
  source,
  baseScore,
  productTitle = "",
  currency = "",
  fallbackRaw = "",
  extraContext = "",
  maxMatches = 4
}) {
  const normalizedText = normalizeWhitespace(text || fallbackRaw || "");
  const combinedContext = normalizeWhitespace(`${normalizedText} ${extraContext}`);
  const matches = findAllPriceLikeMatches(normalizedText);

  if (matches.length) {
    return matches.slice(0, maxMatches).flatMap((match, index) => {
      const windowStart = Math.max(0, match.index - 40);
      const windowEnd = Math.min(normalizedText.length, match.index + match.value.length + 40);
      const localContext = `${normalizedText.slice(windowStart, windowEnd)} ${extraContext}`;
      let score = scoreContext(`${source} ${localContext}`, baseScore);

      if (/\b(?:sale|current|now|today|member|final|your price|our price)\b/i.test(localContext)) {
        score += 14;
      }

      if (/\b(?:regular|list|original|compare|old|was|before|from|starting at|as low as)\b/i.test(localContext)) {
        score -= 18;
      }

      if (HARD_NEGATIVE_PRICE_CONTEXT_REGEX.test(localContext)) {
        score -= 30;
      }

      if (index > 0 && /\b(?:sale|current|now|today|member|final)\b/i.test(normalizedText)) {
        score += 4;
      }

      const candidate = makePriceCandidate({
        value: match.value,
        currency,
        raw: match.value,
        source,
        score,
        productTitle
      });

      return candidate ? [candidate] : [];
    });
  }

  const fallbackMatch =
    findCurrencySymbolPrice(normalizedText) ||
    (parseNumericPrice(normalizedText) !== null ? normalizedText : "");

  if (!fallbackMatch) {
    return [];
  }

  const candidate = makePriceCandidate({
    value: fallbackMatch,
    currency,
    raw: fallbackMatch,
    source,
    score: scoreContext(`${source} ${combinedContext}`, baseScore),
    productTitle
  });

  return candidate ? [candidate] : [];
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
  const offers = [...toArray(node.offers), ...toArray(node.priceSpecification)];
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
    const offerAvailability = String(offer?.availability || node.availability || "").toLowerCase();
    const availabilityAdjustment =
      offerAvailability.includes("outofstock") || offerAvailability.includes("soldout")
        ? -30
        : offerAvailability.includes("instock")
          ? 6
          : 0;
    const candidate = makePriceCandidate({
      value: offer?.price ?? offer?.lowPrice,
      currency: offer?.priceCurrency ?? node.priceCurrency,
      raw: offer?.price ?? offer?.lowPrice ?? "",
      source: "structured data",
      score: (offer?.price ? 100 : 92) + availabilityAdjustment,
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
    ["meta[property='product:price']", "meta product price", 97],
    ["meta[name='twitter:data1']", "twitter meta price", 90],
    ["meta[property='og:price:amount']", "meta og price", 95],
    ["meta[property='og:price']", "meta og price", 93],
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
        score: scoreContext(source, score),
        productTitle: $("meta[property='og:title']").attr("content") || $("title").text()
      });

      if (candidate) {
        candidates.push(candidate);
      }
    });
  });
}

function collectScriptJsonCandidates($, candidates, productTitle) {
  $("script").each((_, element) => {
    const scriptType = ($(element).attr("type") || "").toLowerCase();

    if (scriptType && scriptType.includes("ld+json")) {
      return;
    }

    const scriptText = $(element).contents().text();

    if (!scriptText || scriptText.length > 400000) {
      return;
    }

    const compact = scriptText.replace(/\s+/g, " ");
    const patterns = [
      /"sale[_-]?price"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi,
      /"current[_-]?price"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi,
      /"final[_-]?price"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi,
      /"list[_-]?price"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi,
      /"price"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi,
      /"amount"\s*:\s*"?(?<price>\d+(?:\.\d{2})?)"?/gi
    ];

    patterns.forEach((pattern, patternIndex) => {
      const matches = [...compact.matchAll(pattern)];

      matches.slice(0, 6).forEach((match) => {
        const priceValue = match.groups?.price;

        if (!priceValue) {
          return;
        }

        const currency =
          compact.match(/"priceCurrency"\s*:\s*"(?<currency>[A-Z]{3})"/i)?.groups?.currency ||
          compact.match(/"currency"\s*:\s*"(?<currency>[A-Z]{3})"/i)?.groups?.currency ||
          "";
        const candidate = makePriceCandidate({
          value: priceValue,
          currency,
          raw: priceValue,
          source: "script json",
          score: scoreContext(match[0], 88 + Math.max(0, 4 - patternIndex)),
          productTitle
        });

        if (candidate) {
          candidates.push(candidate);
        }
      });
    });
  });
}

function collectEmbeddedStoreDataCandidates($, candidates, productTitle) {
  const valuePatterns = [
    {
      pattern:
        /["'](?<key>(?:sale|current|final|product|member|promo|offer|list|full|unit|min|max)?[_-]?(?:price|amount|priceString|formattedValue))["']\s*[:=]\s*["'](?<price>[^"']{1,32})["']/gi,
      baseScore: 90
    },
    {
      pattern:
        /["'](?<key>(?:sale|current|final|product|member|promo|offer|list|full|unit|min|max)?[_-]?(?:price|amount))["']\s*[:=]\s*(?<price>\d+(?:\.\d{2})?)/gi,
      baseScore: 86
    }
  ];

  $("script, [data-product], [data-product-json], [data-state], [data-store]").each((_, element) => {
    const rawContent = [
      $(element).attr("data-product"),
      $(element).attr("data-product-json"),
      $(element).attr("data-state"),
      $(element).attr("data-store"),
      $(element).contents().text()
    ]
      .filter(Boolean)
      .join(" ");

    if (!rawContent || rawContent.length > 500000) {
      return;
    }

    const compact = rawContent.replace(/\s+/g, " ");

    valuePatterns.forEach(({ pattern, baseScore }) => {
      const matches = [...compact.matchAll(pattern)];

      matches.slice(0, 10).forEach((match) => {
        const rawPrice = normalizeWhitespace(match.groups?.price || "");
        const key = String(match.groups?.key || "").toLowerCase();

        if (!rawPrice) {
          return;
        }

        const surroundingText = compact.slice(
          Math.max(0, (match.index || 0) - 180),
          Math.min(compact.length, (match.index || 0) + 220)
        );
        const currency =
          surroundingText.match(/["'](?:priceCurrency|currency|currencyCode)["']\s*[:=]\s*["'](?<currency>[A-Z]{3})["']/i)
            ?.groups?.currency || "";
        let score = scoreContext(`${key} ${surroundingText}`, baseScore);

        if (key.includes("sale") || key.includes("current") || key.includes("final") || key.includes("member")) {
          score += 8;
        }

        if (key.includes("list") || key.includes("full") || key.includes("max")) {
          score -= 8;
        }

        const candidate = makePriceCandidate({
          value: rawPrice,
          currency,
          raw: rawPrice,
          source: "embedded store data",
          score,
          productTitle
        });

        if (candidate) {
          candidates.push(candidate);
        }
      });
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
    [".price-current", 86],
    [".price-final", 86],
    [".price-sales", 84],
    [".product-detail-price", 84],
    [".pricing", 76],
    ["[data-price]", 80],
    ["[data-price-amount]", 87],
    ["[data-price-string]", 87],
    ["[data-product-price]", 86],
    ["[data-sale-price]", 86],
    ["[data-current-price]", 87],
    ["[data-final-price]", 87],
    ["[data-testid*='price' i]", 86],
    ["[data-qa*='price' i]", 84],
    ["[data-test*='price' i]", 84],
    ["[data-automation*='price' i]", 84],
    ["[data-selenium*='price' i]", 82],
    ["[itemprop='offers']", 76],
    ["[itemprop='price']", 94],
    ["[itemprop='lowPrice']", 92],
    ["[aria-label*='price' i]", 74],
    ["[aria-label*='$']", 76],
    ["[class*='price']", 68],
    ["[id*='price']", 66],
    ["[class*='sale']", 78],
    ["[class*='cost']", 70]
  ];
  const pageTitle = $("meta[property='og:title']").attr("content") || $("title").text();

  selectors.forEach(([selector, baseScore]) => {
    $(selector).slice(0, 20).each((_, element) => {
      if (isPriceFragmentElement(element, $)) {
        return;
      }

      const text = readText($, element);
      const bestPriceText = readBestPriceText(element, $);
      const className = ($(element).attr("class") || "").toLowerCase();
      const id = ($(element).attr("id") || "").toLowerCase();
      const dataTestId = ($(element).attr("data-testid") || "").toLowerCase();
      const dataQa = ($(element).attr("data-qa") || "").toLowerCase();
      const contextText = `${text} ${className} ${id} ${dataTestId} ${dataQa}`;
      let score = scoreContext(contextText, baseScore);

      if (
        className.includes("old") ||
        className.includes("compare") ||
        className.includes("original") ||
        className.includes("was") ||
        id.includes("old") ||
        id.includes("compare")
      ) {
        score -= 18;
      }

      if (
        className.includes("sale") ||
        className.includes("current") ||
        className.includes("final") ||
        className.includes("member") ||
        className.includes("promo") ||
        dataTestId.includes("sale") ||
        dataTestId.includes("price")
      ) {
        score += 12;
      }

      const selectorCurrency =
        $(element).attr("currency") ||
        $(element).attr("data-currency") ||
        $(element).attr("data-price-currency") ||
        $("meta[property='product:price:currency']").attr("content") ||
        $("meta[itemprop='priceCurrency']").attr("content") ||
        "";

      const candidateList = buildCandidatesFromText({
        text: bestPriceText,
        fallbackRaw: text,
        source: "page selector",
        baseScore: score,
        productTitle: pageTitle,
        currency: selectorCurrency,
        extraContext: `${className} ${id} ${dataTestId} ${dataQa}`
      });

      if (candidateList.length) {
        candidates.push(...candidateList);
      }
    });
  });
}

function collectTitleProximityCandidates($, candidates, productTitle) {
  const titleElement = $("h1").first();

  if (!titleElement.length) {
    return;
  }

  const nearbyElements = [
    titleElement,
    titleElement.parent(),
    titleElement.parent().parent(),
    titleElement.next(),
    titleElement.nextAll().slice(0, 8),
    titleElement.parent().next(),
    titleElement.parent().nextAll().slice(0, 6)
  ];

  nearbyElements.flat().forEach((elementLike) => {
    const element = elementLike?.cheerio ? elementLike : $(elementLike);

    if (!element?.length) {
      return;
    }

    element.find("*").addBack().slice(0, 40).each((_, node) => {
      if (isPriceFragmentElement(node, $)) {
        return;
      }

      const text = readText($, node);
      const bestPriceText = readBestPriceText(node, $);
      const className = ($(node).attr("class") || "").toLowerCase();
      const id = ($(node).attr("id") || "").toLowerCase();
      const dataTestId = ($(node).attr("data-testid") || "").toLowerCase();

      const candidateList = buildCandidatesFromText({
        text: bestPriceText,
        fallbackRaw: text,
        source: "title proximity",
        baseScore: scoreContext(text, 90),
        productTitle,
        extraContext: `${className} ${id} ${dataTestId}`
      });

      if (!candidateList.length) {
        return;
      }

      candidates.push(...candidateList);
    });
  });
}

function collectVisibleTextCandidates($, candidates, productTitle) {
  const commonProductAreaSelectors = [
    "main",
    "[role='main']",
    "#main",
    ".product-detail",
    ".product-details",
    ".pdp",
    ".product",
    "body"
  ];

  commonProductAreaSelectors.forEach((selector, selectorIndex) => {
    $(selector).slice(0, 1).find("*").slice(0, 180).each((_, element) => {
      if (isPriceFragmentElement(element, $)) {
        return;
      }

      const text = readText($, element);
      const bestPriceText = readBestPriceText(element, $);

      if (!text || text.length > 120) {
        return;
      }

      const className = ($(element).attr("class") || "").toLowerCase();
      let score = selectorIndex === commonProductAreaSelectors.length - 1 ? 54 : 72;

      if (className.includes("sale") || className.includes("current") || className.includes("price")) {
        score += 8;
      }

      score = scoreContext(`${text} ${className}`, score);

      const candidateList = buildCandidatesFromText({
        text: bestPriceText,
        source: "visible text",
        baseScore: score,
        productTitle,
        extraContext: className,
        fallbackRaw: text
      });

      if (candidateList.length) {
        candidates.push(...candidateList);
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

function pruneRelatedFragmentCandidates(candidates) {
  return candidates.filter((candidate, _, list) => {
    return !list.some((otherCandidate) => {
      if (otherCandidate === candidate) {
        return false;
      }

      if ((otherCandidate.score || 0) < (candidate.score || 0) + 8) {
        return false;
      }

      const otherValue = Number(otherCandidate.value || 0);
      const candidateValue = Number(candidate.value || 0);

      if (!Number.isFinite(otherValue) || !Number.isFinite(candidateValue)) {
        return false;
      }

      const otherHasCents = Math.round((otherValue % 1) * 100) > 0;

      if (!otherHasCents) {
        return false;
      }

      const wholeMatches = candidateValue === Math.floor(otherValue);
      const centsMatches =
        candidateValue < 100 &&
        candidateValue === Math.round((otherValue % 1) * 100);

      return wholeMatches || centsMatches;
    });
  });
}

function pruneSuspiciousLowOutliers(candidates) {
  return candidates.filter((candidate, _, list) => {
    return !list.some((otherCandidate) => {
      if (otherCandidate === candidate) {
        return false;
      }

      const candidateValue = Number(candidate.value || 0);
      const otherValue = Number(otherCandidate.value || 0);

      if (!Number.isFinite(candidateValue) || !Number.isFinite(otherValue)) {
        return false;
      }

      if (candidateValue >= 40) {
        return false;
      }

      const muchHigherValue = otherValue >= Math.max(candidateValue * 2.5, candidateValue + 25);
      const similarOrBetterScore = (otherCandidate.score || 0) >= (candidate.score || 0) - 4;

      return muchHigherValue && similarOrBetterScore;
    });
  });
}

function collectAvailabilityFromMarkup($) {
  const statusSignals = [];
  const selectors = [
    "[data-stock]",
    "[data-availability]",
    "[data-instock]",
    "[data-testid*='stock' i]",
    "[data-testid*='availability' i]",
    "[itemprop='availability']",
    "[class*='stock']",
    "[class*='availability']",
    "[class*='sold' i]",
    "[class*='cart' i]",
    "[id*='stock']",
    "[id*='availability']",
    "button",
    "[role='button']",
    "form",
    "[aria-live]"
  ];

  selectors.forEach((selector) => {
    $(selector).slice(0, 30).each((_, element) => {
      const combined = normalizeWhitespace(
        [
          $(element).attr("data-stock"),
          $(element).attr("data-availability"),
          $(element).attr("data-instock"),
          $(element).attr("content"),
          $(element).attr("aria-label"),
          $(element).attr("title"),
          $(element).attr("value"),
          $(element).attr("name"),
          $(element).attr("class"),
          $(element).attr("id"),
          $(element).attr("data-testid"),
          $(element).attr("disabled") ? "disabled" : "",
          $(element).attr("aria-disabled") === "true" ? "aria-disabled" : "",
          $(element).text()
        ]
          .filter(Boolean)
          .join(" ")
      );

      if (combined) {
        statusSignals.push(combined);
      }
    });
  });

  return statusSignals.join(" ");
}

function collectAvailabilityFromStructuredData($) {
  const signals = [];

  $("script[type='application/ld+json']").each((_, element) => {
    const parsed = safeJsonParse($(element).contents().text());
    const stack = toArray(parsed);

    while (stack.length) {
      const current = stack.pop();

      if (!current || typeof current !== "object") {
        continue;
      }

      const availability = normalizeWhitespace(
        [
          current.availability,
          current.offerAvailability,
          current.itemAvailability
        ]
          .filter(Boolean)
          .join(" ")
      );

      if (availability) {
        signals.push(availability);
      }

      Object.values(current).forEach((value) => {
        if (value && typeof value === "object") {
          if (Array.isArray(value)) {
            value.forEach((entry) => stack.push(entry));
          } else {
            stack.push(value);
          }
        }
      });
    }
  });

  return signals.join(" ");
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

function detectAvailability(text) {
  const normalized = normalizeWhitespace(text || "");

  if (!normalized) {
    return {
      status: "unknown",
      label: "",
      available: null
    };
  }

  if (UNAVAILABLE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "unavailable",
      label: "No longer available",
      available: false
    };
  }

  if (SOLD_OUT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "sold_out",
      label: "Sold out",
      available: false
    };
  }

  if (POSITIVE_AVAILABILITY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      status: "available",
      label: "Available",
      available: true
    };
  }

  return {
    status: "unknown",
    label: "",
    available: null
  };
}

export function extractProductSignals(html, pageUrl = "") {
  const $ = cheerio.load(html);
  const candidates = [];
  const imageCandidates = [];
  const productTitle =
    firstText($("meta[property='og:title']").attr("content")) ||
    firstText($("title").text()) ||
    firstText($("h1").first().text());
  const pageText = extractPageText(html);
  const markupAvailability = collectAvailabilityFromMarkup($);
  const structuredAvailability = collectAvailabilityFromStructuredData($);
  const availability = detectAvailability(
    `${markupAvailability} ${structuredAvailability} ${pageText}`
  );

  $("script[type='application/ld+json']").each((_, element) => {
    const parsed = safeJsonParse($(element).contents().text());
    collectJsonLdCandidates(parsed, candidates, productTitle);
    collectJsonLdImageCandidates(parsed, imageCandidates, pageUrl);
  });

  collectScriptJsonCandidates($, candidates, productTitle);
  collectEmbeddedStoreDataCandidates($, candidates, productTitle);
  collectMetaCandidates($, candidates);
  collectSelectorCandidates($, candidates);
  collectTitleProximityCandidates($, candidates, productTitle);
  collectVisibleTextCandidates($, candidates, productTitle);
  collectMetaImageCandidates($, imageCandidates, pageUrl);
  collectDomImageCandidates($, imageCandidates, pageUrl, productTitle);

  const uniqueCandidates = dedupeCandidates(
    pruneSuspiciousLowOutliers(pruneRelatedFragmentCandidates(candidates))
  );
  const primaryCandidate = uniqueCandidates[0] || null;
  const primaryImage = selectPrimaryImage(imageCandidates, productTitle);

  return {
    productTitle: primaryCandidate?.productTitle || productTitle,
    productImage: primaryImage?.url || "",
    productImageSource: primaryImage?.source || "",
    priceDetected: Boolean(primaryCandidate),
    primaryPrice: primaryCandidate?.display || "",
    primaryPriceValue: primaryCandidate?.value ?? null,
    primaryPriceCurrency: primaryCandidate?.currency || "",
    primaryPriceSource: primaryCandidate?.source || "",
    primaryPriceConfidence: primaryCandidate?.score || 0,
    detectedPrices: uniqueCandidates.slice(0, 5).map((candidate) => candidate.display),
    availabilityStatus: availability.status,
    availabilityLabel: availability.label,
    available: availability.available
  };
}

export function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}
