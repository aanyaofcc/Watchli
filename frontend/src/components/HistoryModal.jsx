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
    initial: "bg-cyan-400/15 text-cyan-200 border-cyan-300/20",
    changed: "bg-amber-500/15 text-amber-100 border-amber-400/20",
    unchanged: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    error: "bg-rose-500/15 text-rose-100 border-rose-400/20"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[status] || statusClasses.unchanged}`}
    >
      {status}
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
          className={segment.changed ? "rounded bg-cyan-300/15 px-1 text-cyan-100" : ""}
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
          className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100"
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
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-cyan-100">
      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-medium">
        Tracked price: {snapshot.primaryPrice}
      </span>
      {snapshot.primaryPriceSource ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
          Source: {snapshot.primaryPriceSource}
        </span>
      ) : null}
    </div>
  );
}

function getPriceSummary(priceChange) {
  if (!priceChange?.changed) {
    return "";
  }

  if (priceChange.type === "updated") {
    return `${priceChange.previousPrice} -> ${priceChange.currentPrice}`;
  }

  if (priceChange.type === "appeared") {
    return `Now ${priceChange.currentPrice}`;
  }

  if (priceChange.type === "removed") {
    return `Removed ${priceChange.previousPrice}`;
  }

  return priceChange.label || "";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-md">
      <div className="glass-panel relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/10 px-6 py-6 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Website history</p>
          <h2 className="display-font mt-3 break-all text-3xl font-semibold text-white">
            {website.url}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Review recent checks, snapshot previews, and the latest before-and-after changes for this watched page.
          </p>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-6 md:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-300">
              <div className="inline-flex items-center gap-2">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                Loading history...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
              {error}
            </div>
          ) : snapshots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-slate-300">
              No snapshot history yet. Run a check to start building it.
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
                        <p className="mt-1 text-xs text-amber-200/80">
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
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-3xl border border-rose-400/20 bg-rose-500/5 p-4">
                        <p className="mb-3 text-sm font-medium text-rose-200">Previous</p>
                        <SegmentPreview
                          segments={snapshot.diffSummary.previousSegments}
                          fallback={snapshot.diffSummary.previousPreview}
                        />
                        <PricePills prices={snapshot.diffSummary.previousPrices} />
                      </div>
                      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                        <p className="mb-3 text-sm font-medium text-emerald-200">Current</p>
                        <SegmentPreview
                          segments={snapshot.diffSummary.currentSegments}
                          fallback={snapshot.diffSummary.currentPreview}
                        />
                        <PricePills prices={snapshot.diffSummary.currentPrices} />
                      </div>
                    </div>
                  ) : snapshot.snapshotText ? (
                    <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="mb-3 text-sm font-medium text-slate-300">Snapshot preview</p>
                      <p className="line-clamp-5 text-sm leading-7 text-slate-200">
                        {snapshot.snapshotText}
                      </p>
                      <PrimaryPriceBlock snapshot={snapshot} />
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
