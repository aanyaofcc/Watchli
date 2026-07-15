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
    Watching: "bg-white/[0.04] text-slate-200 border-white/10",
    Changed: "bg-[#88BDF2]/14 text-[#BDDDFC] border-[#88BDF2]/18",
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
        ? "border-[#88BDF2]/18 bg-[#88BDF2]/10 text-[#BDDDFC]"
        : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <article className="glass-panel rounded-[26px] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Watched page</p>
            <div
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClasses[website.status] || statusClasses.Watching}`}
            >
              {website.statusLabel || website.status}
            </div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${availabilityClasses}`}>
              {availabilityLabel}
            </div>
          </div>
          <h3 className="display-font mt-2 break-words text-xl font-semibold text-white sm:text-2xl">
            {website.latestProductTitle || "Tracked product page"}
          </h3>
          <div className="mt-2 flex items-start gap-2 text-sm text-slate-400">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="break-all">{website.url}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-400 md:min-w-[220px] md:text-right">
          <p className="inline-flex items-center gap-2 md:justify-end">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Last checked: {formatDate(website.lastChecked)}
          </p>
          <p className="break-words">Last changed: {formatDate(website.lastChanged)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
        {website.latestPrimaryPrice ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#88BDF2]/18 bg-[#88BDF2]/10 px-3 py-1.5 text-sm text-[#BDDDFC]">
            <DollarSign className="h-4 w-4" />
            {website.latestPrimaryPrice}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            <DollarSign className="h-4 w-4" />
            No price yet
          </div>
        )}

        {website.status === "Error" ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100">
            <PackageSearch className="h-4 w-4" />
            Check failed
          </div>
        ) : website.lastDiffSummary?.priceChange?.changed ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#88BDF2]/18 bg-[#88BDF2]/10 px-3 py-1.5 text-sm text-[#BDDDFC]">
            <DollarSign className="h-4 w-4" />
            {getPriceSummary(website.lastDiffSummary.priceChange)}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            <PackageSearch className="h-4 w-4" />
            Watching
          </div>
        )}

        {website.latestPrimaryPriceSource ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
            Source: {website.latestPrimaryPriceSource}
          </div>
        ) : null}
          </div>

          <div>
            <p className="text-sm leading-6 text-slate-300">
              {website.status === "Error"
                ? website.lastErrorMessage || "The website could not be checked successfully."
                : website.lastDiffSummary?.priceChange?.changed
                  ? website.lastDiffSummary.priceChange.label
                  : "Watchli is standing by for price, availability, or content changes on this page."}
            </p>
          </div>

          {website.status === "Error" && website.lastErrorMessage ? (
            <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-rose-200">Failure reason</p>
              <p className="mt-2 text-sm leading-6 text-rose-100">{website.lastErrorMessage}</p>
            </div>
          ) : null}
        </div>

        {website.lastDiffSummary?.priceChange?.changed ? (
          <div className="rounded-3xl border border-[#88BDF2]/18 bg-[#88BDF2]/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#BDDDFC]">Latest price change</p>
            <p className="mt-2 text-base font-semibold text-white">{getPriceDirectionLabel(website.lastDiffSummary.priceChange)}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Previous price</p>
                <p className="mt-1 break-words text-lg font-semibold text-white">
                  {website.lastDiffSummary.priceChange.previousPrice || "Not available"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#88BDF2]/18 bg-[#88BDF2]/10 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-[#BDDDFC]">Current price</p>
                <p className="mt-1 break-words text-lg font-semibold text-white">
                  {website.lastDiffSummary.priceChange.currentPrice || "Not available"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Current watch state</p>
            <p className="mt-2 text-base font-semibold text-white">
              {website.latestPrimaryPrice
                ? `Tracking around ${website.latestPrimaryPrice}`
                : "Waiting for a stronger price signal"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {availability === "available"
                ? "The latest check suggests the product is currently available."
                : availability === "sold_out"
                  ? "The latest check suggests the item is sold out."
                  : availability === "unavailable"
                    ? "The latest check suggests the page is no longer available."
                    : "Run another check or open history for more detail."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onCheck(website.id)}
          disabled={busy}
          className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-[#88BDF2] px-4 py-3 font-semibold text-[#1d2a36] transition hover:bg-[#9cc8f4] disabled:cursor-not-allowed disabled:opacity-60"
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
          View history
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

      {website.latestSnapshotText ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400">
          <TextSearch className="h-4 w-4 text-[#BDDDFC]" />
          Snapshot history is available from the history view.
        </div>
      ) : null}
    </article>
  );
}
