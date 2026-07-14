import {
  Clock3,
  DollarSign,
  ExternalLink,
  History,
  PackageSearch,
  RefreshCw,
  TextSearch,
  Trash2
} from "lucide-react";

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

export function WebsiteCard({ website, onCheck, onDelete, onViewHistory, busy }) {
  const statusClasses = {
    Watching: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    Changed: "bg-amber-500/15 text-amber-100 border-amber-400/20",
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
      ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
      : availability === "available"
        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
        : "border-white/10 bg-white/5 text-slate-300";

  return (
    <article className="glass-panel rounded-[30px] p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Watched website</p>
            <div
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[website.status] || statusClasses.Watching}`}
            >
              {website.statusLabel || website.status}
            </div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${availabilityClasses}`}>
              {availabilityLabel}
            </div>
          </div>
          <h3 className="display-font mt-3 break-words text-2xl font-semibold text-white">
            {website.latestProductTitle || "Tracked product page"}
          </h3>
          <div className="mt-2 flex items-start gap-2 text-sm text-slate-300">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="break-all">{website.url}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-300 md:min-w-[220px] md:text-right">
          <p className="inline-flex items-center gap-2 md:justify-end">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Last checked: {formatDate(website.lastChecked)}
          </p>
          <p className="break-words">Last changed: {formatDate(website.lastChanged)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel-soft rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current price</p>
          {website.latestPrimaryPrice ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-100">
              <DollarSign className="h-4 w-4" />
              Tracked price: {website.latestPrimaryPrice}
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
              <DollarSign className="h-4 w-4" />
              No clear price detected yet
            </div>
          )}

          {website.latestPrimaryPriceSource ? (
            <p className="mt-3 text-sm text-slate-400">Source: {website.latestPrimaryPriceSource}</p>
          ) : null}
        </div>

        <div className="glass-panel-soft rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Latest signal</p>
          {website.status === "Error" ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100">
              <PackageSearch className="h-4 w-4" />
              Check failed
            </div>
          ) : website.lastDiffSummary?.priceChange?.changed ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-sm text-amber-100">
              <DollarSign className="h-4 w-4" />
              {getPriceSummary(website.lastDiffSummary.priceChange)}
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
              <PackageSearch className="h-4 w-4" />
              Monitoring for changes
            </div>
          )}
            <p className="mt-3 text-sm text-slate-300">
            {website.status === "Error"
              ? website.lastErrorMessage || "The website could not be checked successfully."
              : website.lastDiffSummary?.priceChange?.changed
              ? website.lastDiffSummary.priceChange.label
              : "Watchli is standing by for price, availability, or content changes on this page."}
          </p>
        </div>
      </div>

      {website.status === "Error" && website.lastErrorMessage ? (
        <div className="mt-5 rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-rose-200">Failure reason</p>
          <p className="mt-2 text-sm leading-6 text-rose-100">{website.lastErrorMessage}</p>
        </div>
      ) : null}

      {website.lastDiffSummary?.priceChange?.changed ? (
        <div className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-200">Latest price change</p>
          <p className="mt-2 text-base font-semibold text-white">{getPriceDirectionLabel(website.lastDiffSummary.priceChange)}</p>
          <p className="mt-1 text-sm text-amber-100">
            {website.lastDiffSummary.priceChange.label}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous price</p>
              <p className="mt-1 break-words text-lg font-semibold text-white">
                {website.lastDiffSummary.priceChange.previousPrice || "Not available"}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">Current price</p>
              <p className="mt-1 break-words text-lg font-semibold text-white">
                {website.lastDiffSummary.priceChange.currentPrice || "Not available"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onCheck(website.id)}
          disabled={busy}
          className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          {busy ? "Checking..." : "Check Now"}
        </button>
        <button
          type="button"
          onClick={() => onViewHistory(website)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <History className="h-4 w-4" />
          View check history
        </button>
        <button
          type="button"
          onClick={() => onDelete(website.id)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {website.lastDiffSummary?.changed ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-rose-200">
              <History className="h-4 w-4" />
              Previous snapshot
            </div>
            <div className="text-sm leading-7 text-slate-200">
              {website.lastDiffSummary.previousSegments?.map((segment, index) => (
                <span
                  key={`${website.id}-previous-${index}`}
                  className={segment.changed ? "rounded bg-rose-400/20 px-1 text-rose-100" : ""}
                >
                  {segment.text}{" "}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-emerald-200">
              <TextSearch className="h-4 w-4" />
              Current snapshot
            </div>
            <div className="text-sm leading-7 text-slate-200">
              {website.lastDiffSummary.currentSegments?.map((segment, index) => (
                <span
                  key={`${website.id}-current-${index}`}
                  className={segment.changed ? "rounded bg-emerald-400/20 px-1 text-emerald-100" : ""}
                >
                  {segment.text}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : website.latestSnapshotText ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
            <TextSearch className="h-4 w-4 text-cyan-300" />
            Latest saved snapshot
          </div>
          <p className="line-clamp-4 text-sm leading-7 text-slate-200">
            {website.latestSnapshotText}
          </p>
        </div>
      ) : null}
    </article>
  );
}
