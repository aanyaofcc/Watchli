import {
  Clock3,
  ExternalLink,
  History,
  RefreshCw,
  TextSearch,
  Trash2
} from "lucide-react";

function getDomainLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_error) {
    return "Product page";
  }
}

function getFallbackLabel(website) {
  const source = website.latestProductTitle || getDomainLabel(website.url);

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

function formatDate(value) {
  if (!value) {
    return "Not yet";
  }

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getPriceSummary(priceChange) {
  if (!priceChange?.changed) {
    return "";
  }

  if (priceChange.type === "updated") {
    if (priceChange.direction === "down" && priceChange.amount) {
      return `Decreased by ${formatDollarAmount(Math.abs(priceChange.amount))}`;
    }

    if (priceChange.direction === "up" && priceChange.amount) {
      return `Increased by ${formatDollarAmount(priceChange.amount)}`;
    }

    return `${priceChange.previousPrice} -> ${priceChange.currentPrice}`;
  }

  if (priceChange.type === "appeared") {
    return `Now ${priceChange.currentPrice}`;
  }

  if (priceChange.type === "removed") {
    return `Removed ${priceChange.previousPrice}`;
  }

  if (priceChange.type === "sold_out") {
    return "Item is sold out";
  }

  if (priceChange.type === "unavailable") {
    return "No longer available";
  }

  return priceChange.label || "";
}

function formatDollarAmount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatConfidence(confidence) {
  if (!confidence || confidence <= 0) {
    return "Unknown";
  }

  if (confidence >= 90) {
    return "High";
  }

  if (confidence >= 75) {
    return "Strong";
  }

  if (confidence >= 55) {
    return "Medium";
  }

  return "Low";
}

function getSourceLabel(source = "") {
  const normalized = String(source || "").toLowerCase();

  if (!normalized) {
    return "Not identified";
  }

  if (normalized.includes("structured")) {
    return "Structured product data";
  }

  if (normalized.includes("selector")) {
    return "Visible product price block";
  }

  if (normalized.includes("title proximity")) {
    return "Near the product title";
  }

  if (normalized.includes("embedded")) {
    return "Embedded store data";
  }

  if (normalized.includes("script")) {
    return "Store page data";
  }

  if (normalized.includes("meta")) {
    return "Page metadata";
  }

  return source;
}

function getConfidenceNote(confidence) {
  if (!confidence || confidence <= 0) {
    return "Watchli has not found a strong enough price signal yet.";
  }

  if (confidence >= 90) {
    return "This price came from a strong product-specific signal.";
  }

  if (confidence >= 75) {
    return "This price looks reliable, but Watchli is still comparing nearby values.";
  }

  if (confidence >= 55) {
    return "This price is usable, but the page may contain competing price signals.";
  }

  return "This page likely contains multiple competing prices, so double-check the result.";
}

function getDetectionMode(website) {
  return website.detectionMode || ((website.watchType || "product") === "page" ? "page_content" : "product_price");
}

function getDetectionCopy(website) {
  const detectionMode = getDetectionMode(website);

  if (detectionMode === "job_updates") {
    return {
      changedLabel: "Job page changed",
      titleFallback: "Tracked job page",
      watchState: "Watching for job updates",
      idleMessage:
        "Watchli is standing by for new job postings, hiring status changes, or readable edits on this page.",
      changedMessage: "Watchli detected a readable change on this job or hiring page."
    };
  }

  if (detectionMode === "page_content") {
    return {
      changedLabel: "Content changed",
      titleFallback: "Tracked website",
      watchState: "Watching for content updates",
      idleMessage: "Watchli is standing by for content changes on this website.",
      changedMessage: "Watchli detected a readable content change on this website."
    };
  }

  return {
    changedLabel: "Price changed",
    titleFallback: "Tracked product page",
    watchState: "Waiting for a stronger price signal",
    idleMessage: "Watchli is standing by for price, availability, or content changes on this page.",
    changedMessage: ""
  };
}

export function WebsiteCard({ website, onCheck, onDelete, onViewHistory, busy }) {
  const watchType = website.watchType || "product";
  const isPageWatch = watchType === "page";
  const detectionCopy = getDetectionCopy(website);
  const statusClasses = {
    Watching: "bg-white/[0.04] text-slate-200 border-white/10",
    Changed: "bg-[#f3e8db]/10 text-[#f6ead9] border-[#f3e8db]/16",
    Error: "bg-rose-500/15 text-rose-100 border-rose-400/20"
  };
  const availability = website.latestAvailabilityStatus || website.lastDiffSummary?.currentAvailabilityStatus || "unknown";
  const availabilityLabel =
    availability === "sold_out"
      ? "Sold out"
      : availability === "unavailable"
        ? "Unavailable"
        : availability === "available"
          ? "Available"
          : "Availability unknown";
  const availabilityClasses =
    availability === "sold_out" || availability === "unavailable"
      ? "border-amber-300/18 bg-amber-300/10 text-amber-100"
      : availability === "available"
        ? "border-[#f3e8db]/16 bg-[#f3e8db]/10 text-[#f7eee2]"
        : "border-white/10 bg-white/[0.04] text-slate-300";
  const confidenceLabel = formatConfidence(website.latestPrimaryPriceConfidence);
  const hasPriceMeta =
    website.latestPrimaryPriceSource || website.latestPrimaryPriceConfidence || availability !== "unknown";
  const productImage = website.latestProductImage || "";
  const fallbackLabel = getFallbackLabel(website);
  const domainLabel = getDomainLabel(website.url);
  const sourceLabel = getSourceLabel(website.latestPrimaryPriceSource);
  const previousTrackedPrice =
    website.lastDiffSummary?.priceChange?.previousPrice ||
    website.previousPrimaryPrice ||
    "";
  const currentTrackedPrice =
    website.lastDiffSummary?.priceChange?.currentPrice ||
    website.latestPrimaryPrice ||
    "";
  const hasContentChange =
    isPageWatch &&
    website.status === "Changed" &&
    Boolean(website.lastDiffSummary?.contentChanged);

  const activityLabel = website.lastDiffSummary?.priceChange?.changed
    ? getPriceSummary(website.lastDiffSummary.priceChange)
    : hasContentChange
      ? "Readable change found"
      : availability === "sold_out"
        ? "Sold out"
        : availability === "unavailable"
          ? "Unavailable"
          : website.lastChecked
            ? "No new changes"
            : "Waiting for first check";

  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[80px_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.05]">
          {productImage ? (
            <img
              src={productImage}
              alt={website.latestProductTitle || domainLabel}
              className="h-full w-full bg-white/95 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-lg font-semibold tracking-wide text-slate-200">{fallbackLabel}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[website.status] || statusClasses.Watching}`}>
              {website.status === "Changed"
                ? isPageWatch
                  ? detectionCopy.changedLabel
                  : "Price changed"
                : website.statusLabel || website.status}
            </span>
            {!isPageWatch ? (
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${availabilityClasses}`}>
                {availabilityLabel}
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
                {getDetectionMode(website) === "job_updates" ? "Job updates" : "Content changes"}
              </span>
            )}
          </div>

          <h3 className="mt-2 truncate text-xl font-semibold text-white sm:text-2xl">
            {website.latestProductTitle || detectionCopy.titleFallback}
          </h3>
          <a
            href={website.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">{domainLabel}</span>
          </a>

          {!isPageWatch && hasPriceMeta ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{sourceLabel}</span>
              <span
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1"
                title={getConfidenceNote(website.latestPrimaryPriceConfidence)}
              >
                {confidenceLabel} confidence
              </span>
            </div>
          ) : null}
        </div>

        <div className="lg:min-w-[190px] lg:text-right">
          <p className="text-2xl font-semibold text-white">
            {currentTrackedPrice || (isPageWatch ? "Monitoring" : "Price pending")}
          </p>
          <p className={`mt-1 text-sm ${
            website.lastDiffSummary?.priceChange?.direction === "down"
              ? "text-emerald-300"
              : website.lastDiffSummary?.priceChange?.direction === "up"
                ? "text-amber-200"
                : website.status === "Error"
                  ? "text-rose-200"
                  : "text-slate-300"
          }`}>
            {website.status === "Error"
              ? website.lastErrorMessage || "Check failed"
              : activityLabel}
          </p>
          {previousTrackedPrice && previousTrackedPrice !== currentTrackedPrice ? (
            <p className="mt-1 text-xs text-slate-400">Previously {previousTrackedPrice}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            Checked {formatDate(website.lastChecked)}
          </span>
          <span>Changed {formatDate(website.lastChanged)}</span>
          {website.latestSnapshotText ? (
            <span className="inline-flex items-center gap-1.5">
              <TextSearch className="h-4 w-4" /> Snapshot saved
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCheck(website.id)}
            disabled={busy}
            className="theme-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Checking" : "Check now"}
          </button>
          <button
            type="button"
            onClick={() => onViewHistory(website)}
            disabled={busy}
            className="theme-outline-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <History className="h-4 w-4" />
            History
          </button>
          <button
            type="button"
            onClick={() => onDelete(website.id)}
            disabled={busy}
            aria-label={`Delete ${website.latestProductTitle || domainLabel}`}
            className="inline-flex items-center justify-center rounded-xl border border-rose-300/15 bg-rose-400/5 p-2.5 text-rose-100 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
