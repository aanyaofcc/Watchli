import { useEffect, useState } from "react";
import { Bell, Crown, LoaderCircle, Mail, RefreshCw, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import {
  checkSite,
  createBillingPortalSession,
  createWebsite,
  deleteWebsite,
  fetchMyWebsites,
  fetchWebsiteSnapshots,
  sendTestEmail,
  syncWebsites
} from "../lib/api";
import { HistoryModal } from "../components/HistoryModal";
import { WebsiteCard } from "../components/WebsiteCard";
import { normalizeWebsiteUrl } from "../lib/url";

function isValidUrl(url) {
  return /^https?:\/\//i.test(url);
}

function formatStatusLabel(status) {
  if (status === "Changed") {
    return "Needs review";
  }

  if (status === "Watching") {
    return "Watching";
  }

  if (status === "Error") {
    return "Check failed";
  }

  return status || "Unknown";
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [account, setAccount] = useState({
    plan: "free",
    planLabel: "Free plan",
    websiteLimit: 5,
    websiteCount: 0,
    websiteSlotsRemaining: 5,
    checkFrequency: "Daily checks",
    premium: false,
    upgradeAvailable: true
  });
  const [scheduler, setScheduler] = useState(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingId, setCheckingId] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [loadingWebsites, setLoadingWebsites] = useState(true);
  const [refreshingWebsites, setRefreshingWebsites] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [historySnapshots, setHistorySnapshots] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [openingBilling, setOpeningBilling] = useState(false);
  const changedWebsites = websites.filter((website) => website.status === "Changed");
  const errorWebsites = websites.filter((website) => website.status === "Error");
  const availableWebsites = websites.filter(
    (website) => (website.latestAvailabilityStatus || "unknown") === "available"
  );
  const priceAwareWebsites = websites.filter((website) => website.latestPrimaryPrice);
  const mostRecentWebsite = [...websites].sort((left, right) => {
    const leftDate = new Date(left.lastChanged || left.lastChecked || left.createdAt || 0).getTime();
    const rightDate = new Date(right.lastChanged || right.lastChecked || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  })[0];

  const loadWebsites = async ({ showRefreshing = false } = {}) => {
    if (!user) {
      return;
    }

    if (showRefreshing) {
      setRefreshingWebsites(true);
    } else {
      setLoadingWebsites(true);
    }

    try {
      await syncWebsites().catch(() => undefined);
      const payload = await fetchMyWebsites();
      setWebsites(payload.websites || []);
      setScheduler(payload.scheduler || null);
      setAccount((current) => ({
        ...current,
        ...(payload.account || {})
      }));
    } catch (loadError) {
      setError(loadError.message || "Could not load your watched websites.");
    } finally {
      setLoadingWebsites(false);
      setRefreshingWebsites(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    void loadWebsites();
    return undefined;
  }, [user]);

  const handleAddWebsite = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    let normalizedUrl;

    try {
      normalizedUrl = normalizeWebsiteUrl(url);
    } catch (_error) {
      setError("Please enter a valid public webpage URL.");
      return;
    }

    if (websites.length >= account.websiteLimit) {
      setError(
        `${account.planLabel} allows up to ${account.websiteLimit} websites. Upgrade to Pro to watch more pages.`
      );
      return;
    }

    const alreadyExists = websites.some((website) => {
      const existingUrl = website.normalizedUrl || website.url;

      try {
        return normalizeWebsiteUrl(existingUrl) === normalizedUrl;
      } catch (_error) {
        return existingUrl === normalizedUrl;
      }
    });

    if (alreadyExists) {
      setError("That website is already being watched.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = await createWebsite(normalizedUrl);
      setAccount((current) => ({
        ...current,
        ...(payload.account || {})
      }));
      await loadWebsites({ showRefreshing: true });
      setSuccess("Website added to your dashboard.");
      setUrl("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckWebsite = async (websiteId) => {
    setError("");
    setSuccess("");
    setCheckingId(websiteId);

    try {
      const result = await checkSite(websiteId, user.uid);
      await loadWebsites({ showRefreshing: true });
      setSuccess(result.message || "Website checked successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckingId("");
    }
  };

  const handleDeleteWebsite = async (websiteId) => {
    setError("");
    setSuccess("");

    try {
      const payload = await deleteWebsite(websiteId);
      setAccount((current) => ({
        ...current,
        ...(payload.account || {})
      }));
      await loadWebsites({ showRefreshing: true });
      setSuccess("Website removed.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSendTestEmail = async () => {
    setError("");
    setSuccess("");
    setSendingEmail(true);

    try {
      const result = await sendTestEmail(user.email);
      setSuccess(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleViewHistory = async (website) => {
    setSelectedWebsite(website);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const snapshots = await fetchWebsiteSnapshots(website.id);
      setHistorySnapshots(snapshots);
    } catch (requestError) {
      setHistoryError(requestError.message || "Could not load website history.");
      setHistorySnapshots([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setSelectedWebsite(null);
    setHistorySnapshots([]);
    setHistoryError("");
  };

  const handleUpgradeClick = () => {
    navigate("/upgrade");
  };

  const handleManageBilling = async () => {
    setError("");
    setSuccess("");
    setOpeningBilling(true);

    try {
      const payload = await createBillingPortalSession();
      window.location.href = payload.url;
    } catch (requestError) {
      setError(requestError.message || "Could not open the billing portal.");
      setOpeningBilling(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="glass-panel rounded-[32px] p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-[#FFFFE3]">Dashboard</p>
              <h1 className="display-font mt-3 break-words text-2xl font-semibold text-white sm:text-3xl">
                Welcome back{user?.email ? `, ${user.email}` : ""}
              </h1>
            </div>
            <div className="data-chip w-fit rounded-full px-4 py-2 text-sm text-slate-300">
              {account.planLabel}
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Add a product or shopping page, let Watchli capture its readable content, and
            get alerted when the price or listing details appear to change.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleAddWebsite}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Add Product Page</span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://store.com/product/example"
                  className="w-full rounded-2xl border border-[#CBCBCB]/16 bg-[#4A4A4A]/40 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-[#6D8196]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="glow-button w-full rounded-2xl bg-[#FFFFE3] px-5 py-3 font-semibold text-[#4A4A4A] transition hover:bg-[#fffbd3] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Adding..." : "Add Website"}
                </button>
              </div>
            </label>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {account.websiteCount} of {account.websiteLimit} slots used
            </span>
            <span className="rounded-full border border-[#CBCBCB]/20 bg-white/10 px-3 py-1.5 text-[#FFFFE3]">
              {account.checkFrequency}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Tracked pages</p>
              <p className="display-font mt-2 text-2xl font-semibold text-white">{websites.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Price found</p>
              <p className="display-font mt-2 text-2xl font-semibold text-white">{priceAwareWebsites.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Need attention</p>
              <p className="display-font mt-2 text-2xl font-semibold text-white">{changedWebsites.length + errorWebsites.length}</p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#FFFFE3]" />
              <div>
                <p className="text-sm text-slate-400">Quick actions</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  Stay on top of checks
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {errorWebsites.length > 0
                ? `${errorWebsites.length} watch${errorWebsites.length === 1 ? "" : "es"} need another check.`
                : changedWebsites.length > 0
                  ? `${changedWebsites.length} watch${changedWebsites.length === 1 ? "" : "es"} changed recently.`
                  : "Everything is looking steady right now."}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingEmail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#CBCBCB]/16 bg-white/[0.06] px-4 py-3 text-sm text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {sendingEmail ? "Sending..." : "Send Test Email"}
              </button>
              <button
                type="button"
                onClick={() => void loadWebsites({ showRefreshing: true })}
                disabled={refreshingWebsites || loadingWebsites}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#CBCBCB]/16 bg-white/[0.06] px-4 py-3 text-sm text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingWebsites ? "animate-spin" : ""}`} />
                Refresh dashboard
              </button>
            </div>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-[#FFFFE3] ${scheduler?.running ? "animate-spin" : ""}`} />
              <div>
                <p className="text-sm text-slate-400">Automatic checks</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  {scheduler?.running
                    ? "Scheduler running"
                    : scheduler?.lastCompletedAt
                      ? "Scheduler active"
                      : "No scheduler run yet"}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {scheduler?.lastError
                ? `Last scheduler issue: ${scheduler.lastError}`
                : scheduler?.lastCompletedAt
                  ? `Last completed: ${new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(scheduler.lastCompletedAt))}`
                  : "Automatic checks will appear here after the first scheduled run."}
            </p>
            {scheduler?.lastCompletedAt ? (
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {scheduler.lastRunTotal || 0} checked
                </span>
                <span className="rounded-full border border-[#6D8196]/24 bg-[#6D8196]/18 px-3 py-1.5 text-white">
                  {scheduler.lastRunChanged || 0} changed
                </span>
                <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-rose-100">
                  {scheduler.lastRunFailed || 0} failed
                </span>
              </div>
            ) : null}
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-[#FFFFE3]" />
              <div>
                <p className="text-sm text-slate-400">Plan</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  {account.premium ? "Watchli Pro" : "Free plan"}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {account.premium
                ? "Manage your subscription and keep room for more watched products."
                : "Upgrade when you want more watched pages and premium plan headroom."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleUpgradeClick}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#6D8196]/24 bg-[#6D8196]/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#6D8196]/30"
              >
                <Zap className="h-4 w-4" />
                {account.premium ? "View Pro plan" : "Upgrade to Pro"}
              </button>
              {account.premium ? (
                <button
                  type="button"
                  onClick={() => void handleManageBilling()}
                  disabled={openingBilling}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#CBCBCB]/16 bg-white/[0.06] px-4 py-3 text-sm text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openingBilling ? "Opening..." : "Manage Billing"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-font text-2xl font-semibold text-white">
              Your watched product pages
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {websites.length > 0
                ? `Latest activity: ${mostRecentWebsite?.latestProductTitle || mostRecentWebsite?.url || "Tracked page"}`
                : "Start by adding a product page you want Watchli to monitor."}
            </p>
          </div>
          <p className="text-sm text-slate-400">
            {availableWebsites.length} available now
          </p>
        </div>

        {loadingWebsites ? (
          <div className="glass-panel-soft rounded-3xl p-8 text-center text-slate-300">
            <div className="inline-flex items-center gap-2">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
              Loading your watched websites...
            </div>
          </div>
        ) : websites.length === 0 ? (
          <div className="glass-panel-soft rounded-3xl border border-dashed p-8 text-center">
            <p className="display-font text-2xl font-semibold text-white">No watched pages yet</p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Paste in a product page above and Watchli will save the first snapshot, detect likely prices,
              and keep checking for changes you care about.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Add a public product URL
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">
                Run manual checks anytime
              </span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {websites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={{
                  ...website,
                  statusLabel: formatStatusLabel(website.status)
                }}
                onCheck={handleCheckWebsite}
                onDelete={handleDeleteWebsite}
                onViewHistory={handleViewHistory}
                busy={checkingId === website.id}
              />
            ))}
          </div>
        )}
      </section>

      <HistoryModal
        website={selectedWebsite}
        snapshots={historySnapshots}
        open={historyOpen}
        loading={historyLoading}
        error={historyError}
        onClose={handleCloseHistory}
      />
    </div>
  );
}
