import { Clock3, LoaderCircle, X } from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  const statusClasses = {
    initial: "border-[#c9a37f]/18 bg-[#8d5b40]/20 text-amber-50",
    changed: "border-[#c9a37f]/18 bg-[#8d5b40]/20 text-amber-50",
    unchanged: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    error: "bg-rose-500/15 text-rose-100 border-rose-400/20"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[status] || statusClasses.unchanged}`}
    >
      {status === "initial"
        ? "Initial snapshot"
        : status === "changed"
          ? "Change detected"
          : status === "unchanged"
            ? "No change"
            : status === "error"
              ? "Check failed"
              : status}
    </span>
  );
}

function SegmentPreview({ segments, fallback }) {
  if (!segments?.length) {
    return <p className="text-sm leading-7 text-slate-200">{fallback || "No preview available."}</p>;
  }

  return (
    <div className="text-sm leading-7 text-slate-200">
      {segments.map((segment, index) => (
        <span
          key={`${segment.text}-${index}`}
          className={segment.changed ? "rounded bg-[#8d5b40]/20 px-1 text-amber-50" : ""}
        >
          {segment.text}{" "}
        </span>
      ))}
    </div>
  );
}

function PricePills({ prices }) {
  if (!prices?.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {prices.map((price) => (
        <span
          key={price}
          className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1 text-xs font-medium text-amber-50"
        >
          {price}
        </span>
      ))}
    </div>
  );
}

function PrimaryPriceBlock({ snapshot }) {
  if (!snapshot.primaryPrice) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-amber-50">
      <span className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1 font-medium">
        Tracked price: {snapshot.primaryPrice}
      </span>
      {snapshot.primaryPriceSource ? (
        <span className="rounded-full border border-[#d3b697]/12 bg-white/[0.05] px-3 py-1 text-stone-200">
          Source: {snapshot.primaryPriceSource}
        </span>
      ) : null}
    </div>
  );
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

export function HistoryModal({
  website,
  snapshots,
  open,
  loading,
  error,
  onClose
}) {
  if (!open || !website) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-8">
      <div className="glass-panel relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] sm:rounded-[32px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full border border-[#d3b697]/12 bg-white/[0.06] p-2 text-stone-100 transition hover:bg-white/[0.1]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/10 px-4 py-5 sm:px-6 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-amber-200">Watch details</p>
          <h2 className="display-font mt-3 break-all text-2xl font-semibold text-white sm:text-3xl">
            {website.latestProductTitle || website.url}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Review the current watch status, tracked price, and recent check history for this product page.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Current price</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {website.latestPrimaryPrice || "Not detected yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Price source</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {getSourceLabel(website.latestPrimaryPriceSource)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Availability</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {website.latestAvailabilityLabel || "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Confidence</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatConfidence(website.latestPrimaryPriceConfidence)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Last check</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatDate(website.lastChecked)}
              </p>
            </div>
          </div>
          {website.lastErrorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-100">
              Latest error: {website.lastErrorMessage}
            </div>
          ) : null}
        </div>

        <div className="max-h-[74vh] overflow-y-auto px-4 py-5 sm:px-6 md:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-300">
              <div className="inline-flex items-center gap-2">
                <LoaderCircle className="h-5 w-5 animate-spin text-amber-200" />
                Loading history...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {error}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-slate-300">
              No check history yet. Run a manual check to capture the first saved snapshot for this page.
            </div>
          ) : (
            <div className="space-y-5">
              {snapshots.map((snapshot) => (
                <article
                  key={snapshot.id}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={snapshot.status} />
                      <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <Clock3 className="h-4 w-4 text-slate-500" />
                        {formatDate(snapshot.checkedAt)}
                      </p>
                    </div>
                    {snapshot.diffSummary?.priceChange?.changed ? (
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-100">
                          Price alert: {getPriceSummary(snapshot.diffSummary.priceChange)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {snapshot.diffSummary.priceChange.label}
                        </p>
                      </div>
                    ) : snapshot.diffSummary?.changedWordCount ? (
                      <p className="text-sm text-slate-300">
                        {snapshot.diffSummary.changedWordCount} changed word
                        {snapshot.diffSummary.changedWordCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </div>

                  {snapshot.status === "changed" && snapshot.diffSummary ? (
                    <div className="mt-5 space-y-4">
                      {snapshot.diffSummary?.priceChange?.changed ? (
                        <div className="rounded-3xl border border-[#c9a37f]/18 bg-[#8d5b40]/20 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-amber-50">
                            {getPriceDirectionLabel(snapshot.diffSummary.priceChange)}
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous price</p>
                              <p className="mt-1 text-lg font-semibold text-white">
                                {snapshot.diffSummary.priceChange.previousPrice || "Not available"}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-[#c9a37f]/18 bg-[#8d5b40]/18 p-3">
                              <p className="text-xs uppercase tracking-[0.14em] text-amber-50">Current price</p>
                              <p className="mt-1 text-lg font-semibold text-white">
                                {snapshot.diffSummary.priceChange.currentPrice || "Not available"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-3xl border border-rose-400/20 bg-rose-500/5 p-4">
                          <p className="mb-3 text-sm font-medium text-rose-200">Previous snapshot</p>
                          <SegmentPreview
                            segments={snapshot.diffSummary.previousSegments}
                            fallback={snapshot.diffSummary.previousPreview}
                          />
                          <PricePills prices={snapshot.diffSummary.previousPrices} />
                        </div>
                        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                          <p className="mb-3 text-sm font-medium text-emerald-200">Current snapshot</p>
                          <SegmentPreview
                            segments={snapshot.diffSummary.currentSegments}
                            fallback={snapshot.diffSummary.currentPreview}
                          />
                          <PricePills prices={snapshot.diffSummary.currentPrices} />
                        </div>
                      </div>
                    </div>
                  ) : snapshot.status === "error" ? (
                    <div className="mt-5 rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
                      <p className="text-sm font-medium text-rose-100">This check did not complete successfully.</p>
                      <p className="mt-2 text-sm leading-6 text-rose-100/90">
                        {snapshot.errorMessage || "No detailed error message was saved for this failed check."}
                      </p>
                    </div>
                  ) : snapshot.snapshotText ? (
                    <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="mb-3 text-sm font-medium text-slate-300">Saved snapshot preview</p>
                      <p className="line-clamp-5 text-sm leading-7 text-slate-200">
                        {snapshot.snapshotText}
                      </p>
                      <PrimaryPriceBlock snapshot={snapshot} />
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-200">
                        {snapshot.primaryPriceSource ? (
                          <span className="rounded-full border border-[#d3b697]/12 bg-white/[0.06] px-3 py-1">
                            Source: {getSourceLabel(snapshot.primaryPriceSource)}
                          </span>
                        ) : null}
                        {snapshot.primaryPriceConfidence ? (
                          <span className="rounded-full border border-[#d3b697]/12 bg-white/[0.06] px-3 py-1">
                            Confidence: {formatConfidence(snapshot.primaryPriceConfidence)}
                          </span>
                        ) : null}
                      </div>
                      <PricePills prices={snapshot.detectedPrices || snapshot.diffSummary?.currentPrices} />
                    </div>
                  ) : (
                    <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                      No readable snapshot was stored for this check.
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
