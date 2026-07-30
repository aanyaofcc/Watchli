import {
  Clock3,
  DollarSign,
  ExternalLink,
  History,
  Info,
  PackageSearch,
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

function getPriceDirectionLabel(priceChange) {
  if (!priceChange?.changed) {
    return "";
  }

  if (priceChange.direction === "down") {
    return priceChange.amount
      ? `Price decreased by ${formatDollarAmount(Math.abs(priceChange.amount))}`
      : "Price dropped";
  }

  if (priceChange.direction === "up") {
    return priceChange.amount
      ? `Price increased by ${formatDollarAmount(priceChange.amount)}`
      : "Price increased";
  }

  if (priceChange.direction === "appeared") {
    return "Price found";
  }

  if (priceChange.direction === "removed") {
    return "Price removed";
  }

  if (priceChange.direction === "sold_out") {
    return "Item sold out";
  }

  if (priceChange.direction === "unavailable") {
    return "Item no longer available";
  }

  return "Price changed";
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

  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                website.status === "Changed"
                  ? "bg-emerald-400/15 text-emerald-200"
                  : website.status === "Error"
                    ? "bg-rose-500/15 text-rose-100"
                    : "bg-white/10 text-slate-200"
              }`}
            >
              {website.status === "Changed"
                ? isPageWatch
                  ? detectionCopy.changedLabel
                  : "Price changed"
                : website.statusLabel || website.status}
            </span>
            {!isPageWatch ? (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${availabilityClasses}`}>
                {availabilityLabel}
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 text-2xl font-semibold text-white">
            {website.latestProductTitle || detectionCopy.titleFallback}
          </h3>
          <div className="mt-1 flex items-start gap-2 text-sm text-slate-300">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="break-all">{website.url}</p>
          </div>
        </div>

        <div className="min-w-[140px] text-right">
          <p className="text-2xl font-semibold text-white">
            {currentTrackedPrice || (isPageWatch ? "Watching" : "No price")}
          </p>
          <p
            className={`mt-1 text-sm ${
              website.lastDiffSummary?.priceChange?.direction === "down"
                ? "text-emerald-300"
                : website.lastDiffSummary?.priceChange?.direction === "up"
                  ? "text-amber-200"
                  : "text-slate-300"
            }`}
          >
            {website.lastDiffSummary?.priceChange?.changed
              ? getPriceSummary(website.lastDiffSummary.priceChange)
              : hasContentChange
                ? "Readable change found"
                : availability === "sold_out"
                  ? "Sold out"
                  : availability === "unavailable"
                    ? "Unavailable"
                    : "Stable"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm leading-6 text-slate-200">
            {website.status === "Error"
              ? website.lastErrorMessage || "The website could not be checked successfully."
              : hasContentChange
                ? detectionCopy.changedMessage
                : website.lastDiffSummary?.priceChange?.changed
                  ? website.lastDiffSummary.priceChange.label
                  : detectionCopy.idleMessage}
          </p>

          {!isPageWatch && hasPriceMeta ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                {sourceLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                Confidence {confidenceLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Watch state</p>
          <p className="mt-2 text-base font-semibold text-white">
            {!isPageWatch && website.latestPrimaryPrice
              ? `Tracking around ${website.latestPrimaryPrice}`
              : detectionCopy.watchState}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Last checked: {formatDate(website.lastChecked)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Last changed: {formatDate(website.lastChanged)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onCheck(website.id)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#356dcf] bg-[#2c2725] px-4 py-3 font-semibold text-white transition hover:bg-[#34302d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          {busy ? "Checking..." : "Check Now"}
        </button>
        <button
          type="button"
          onClick={() => onViewHistory(website)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d3b697]/12 bg-white/[0.06] px-4 py-3 text-stone-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <History className="h-4 w-4" />
          View history
        </button>
        <button
          type="button"
          onClick={() => onDelete(website.id)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d3b697]/12 bg-white/[0.06] px-4 py-3 text-stone-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {website.latestSnapshotText ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400">
          <TextSearch className="h-4 w-4 text-amber-200" />
          Snapshot history is available from the history view.
        </div>
      ) : null}
    </article>
  );
}
