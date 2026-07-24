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

export function WebsiteCard({ website, onCheck, onDelete, onViewHistory, busy }) {
  const watchType = website.watchType || "product";
  const isPageWatch = watchType === "page";
  const statusClasses = {
    Watching: "bg-white/[0.04] text-slate-200 border-white/10",
    Changed: "bg-[#8d5b40]/18 text-amber-50 border-[#c9a37f]/18",
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
        ? "border-[#c9a37f]/18 bg-[#8d5b40]/20 text-amber-50"
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
    <article className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-[0_14px_28px_rgba(15,23,42,0.16)]">
              {productImage ? (
                <img
                  src={productImage}
                  alt={website.latestProductTitle || "Tracked product"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(135deg,rgba(96,165,250,0.22),rgba(148,163,184,0.08))] text-center">
                  <span className="display-font text-lg font-semibold text-white">{fallbackLabel || "WP"}</span>
                  <span className="mt-1 px-3 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                    {domainLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {isPageWatch ? "Watched website" : "Watched page"}
                </p>
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-300">
                  {isPageWatch ? "Content watch" : "Price watch"}
                </div>
                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[website.status] || statusClasses.Watching}`}
                >
                  {website.statusLabel || website.status}
                </div>
                {!isPageWatch ? (
                  <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${availabilityClasses}`}>
                    {availabilityLabel}
                  </div>
                ) : null}
              </div>
              <h3 className="display-font mt-3 break-words text-xl font-semibold text-white sm:text-2xl">
                {website.latestProductTitle || (isPageWatch ? "Tracked website" : "Tracked product page")}
              </h3>
              <div className="mt-2 flex items-start gap-2 text-sm text-slate-400">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <p className="break-all">{website.url}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-400 md:min-w-[220px]">
          <p className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Last checked: {formatDate(website.lastChecked)}
          </p>
          <p className="break-words">Last changed: {formatDate(website.lastChanged)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
            {!isPageWatch && website.latestPrimaryPrice ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-sm text-amber-50">
                <DollarSign className="h-4 w-4" />
                {website.latestPrimaryPrice}
              </div>
            ) : !isPageWatch ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                <DollarSign className="h-4 w-4" />
                No price yet
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                <TextSearch className="h-4 w-4" />
                Watching page content
              </div>
            )}

            {website.status === "Error" ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100">
                <PackageSearch className="h-4 w-4" />
                Check failed
              </div>
            ) : !isPageWatch && website.lastDiffSummary?.priceChange?.changed ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-sm text-amber-50">
                <DollarSign className="h-4 w-4" />
                {getPriceSummary(website.lastDiffSummary.priceChange)}
              </div>
            ) : hasContentChange ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-sm text-amber-50">
                <TextSearch className="h-4 w-4" />
                Content changed
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                <PackageSearch className="h-4 w-4" />
                Watching
              </div>
            )}
          </div>

          <div>
            <p className="text-sm leading-6 text-slate-300">
              {website.status === "Error"
                ? website.lastErrorMessage || "The website could not be checked successfully."
                : hasContentChange
                  ? "Watchli detected a readable content change on this website."
                  : website.lastDiffSummary?.priceChange?.changed
                  ? website.lastDiffSummary.priceChange.label
                  : isPageWatch
                    ? "Watchli is standing by for content changes on this website."
                    : "Watchli is standing by for price, availability, or content changes on this page."}
            </p>
          </div>

          {isPageWatch ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#c9a37f]/18 bg-[#8d5b40]/14 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-100/80">Latest preview</p>
                <p className="mt-2 text-sm leading-6 text-white">
                  {website.lastDiffSummary?.currentPreview || website.latestSnapshotText?.slice(0, 160) || "No preview yet"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous preview</p>
                <p className="mt-2 text-sm leading-6 text-white">
                  {website.lastDiffSummary?.previousPreview || "No earlier snapshot yet"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Changed words</p>
                <p className="mt-2 break-words text-2xl font-semibold text-white">
                  {website.lastDiffSummary?.changedWordCount || 0}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Watchli compares the readable page text between checks for this watch.
                </p>
              </div>
            </div>
          ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#c9a37f]/18 bg-[#8d5b40]/14 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-100/80">Tracked price now</p>
              <p className="mt-2 break-words text-2xl font-semibold text-white">
                {currentTrackedPrice || "Not detected yet"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {currentTrackedPrice
                  ? "This is the price Watchli is currently monitoring for alerts."
                  : "Run another check if the product page should already show a price."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous tracked price</p>
              <p className="mt-2 break-words text-2xl font-semibold text-white">
                {previousTrackedPrice || "No earlier price yet"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {previousTrackedPrice
                  ? "Useful for seeing what changed before the latest check."
                  : "Watchli will show the prior tracked price once this page changes."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Why this price</p>
              <p className="mt-2 text-sm font-medium text-white">{sourceLabel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {getConfidenceNote(website.latestPrimaryPriceConfidence)}
              </p>
            </div>
          </div>
          )}

          {!isPageWatch && hasPriceMeta ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Price source</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {sourceLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Confidence</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Info className="h-4 w-4 text-amber-200" />
                  {confidenceLabel}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Availability</p>
                <p className="mt-2 text-sm font-medium text-white">{availabilityLabel}</p>
              </div>
            </div>
          ) : null}

          {website.status === "Error" && website.lastErrorMessage ? (
            <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-rose-200">Failure reason</p>
              <p className="mt-2 text-sm leading-6 text-rose-100">{website.lastErrorMessage}</p>
            </div>
          ) : null}
        </div>

        {!isPageWatch && website.lastDiffSummary?.priceChange?.changed ? (
          <div className="rounded-3xl border border-[#7995bb]/24 bg-[#58759a]/22 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-50">Latest price change</p>
            <p className="mt-2 text-base font-semibold text-white">{getPriceDirectionLabel(website.lastDiffSummary.priceChange)}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous price</p>
                <p className="mt-1 break-words text-lg font-semibold text-white">
                  {website.lastDiffSummary.priceChange.previousPrice || "Not available"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#7995bb]/24 bg-[#58759a]/26 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-amber-50">Current price</p>
                <p className="mt-1 break-words text-lg font-semibold text-white">
                  {website.lastDiffSummary.priceChange.currentPrice || "Not available"}
                </p>
              </div>
            </div>
          </div>
        ) : isPageWatch && hasContentChange ? (
          <div className="rounded-3xl border border-[#7995bb]/24 bg-[#58759a]/22 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-50">Latest website change</p>
            <p className="mt-2 text-base font-semibold text-white">Content changed on the watched page</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {website.lastDiffSummary?.currentPreview || "Open history to compare the latest saved snapshots."}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current watch state</p>
            <p className="mt-2 text-base font-semibold text-white">
              {!isPageWatch && website.latestPrimaryPrice
                ? `Tracking around ${website.latestPrimaryPrice}`
                : isPageWatch
                  ? "Watching for content updates"
                  : "Waiting for a stronger price signal"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {isPageWatch
                ? "Run another check or open history if you want to compare the latest readable page content."
                : availability === "available"
                ? "The latest check suggests the product is currently available."
                : availability === "sold_out"
                  ? "The latest check suggests the item is sold out."
                  : availability === "unavailable"
                    ? "The latest check suggests the page is no longer available."
                    : "Run another check or open history for more detail."}
            </p>
            {!isPageWatch && (website.latestPrimaryPriceSource || website.latestPrimaryPriceConfidence) ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-200">
                {website.latestPrimaryPriceSource ? (
                  <span className="rounded-full border border-[#d3b697]/12 bg-white/[0.06] px-3 py-1.5">
                    Source: {sourceLabel}
                  </span>
                ) : null}
                {website.latestPrimaryPriceConfidence ? (
                  <span className="rounded-full border border-[#d3b697]/12 bg-white/[0.06] px-3 py-1.5">
                    Confidence: {confidenceLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onCheck(website.id)}
          disabled={busy}
          className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#3d6283] px-4 py-3 font-semibold text-white transition hover:bg-[#345571] disabled:cursor-not-allowed disabled:opacity-60"
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
