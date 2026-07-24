import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CircleDashed,
  Crown,
  LoaderCircle,
  Mail,
  RefreshCw,
  Sparkles,
  X,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import {
  checkSite,
  createBillingPortalSession,
  createWebsite,
  deleteWebsite,
  fetchMyWebsites,
  fetchWebsiteSnapshots,
  inspectWebsite,
  sendTestEmail,
  syncWebsites
} from "../lib/api";
import { trackEvent } from "../lib/analytics";
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

const ONBOARDING_STORAGE_KEY = "watchli-dashboard-onboarding-dismissed";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [account, setAccount] = useState({
    plan: "free",
    planLabel: "Free plan",
    websiteLimit: 3,
    websiteCount: 0,
    websiteSlotsRemaining: 3,
    checkFrequency: "Daily checks",
    premium: false,
    upgradeAvailable: true
  });
  const [scheduler, setScheduler] = useState(null);
  const [url, setUrl] = useState("");
  const [watchType, setWatchType] = useState("product");
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
  const [inspectUrl, setInspectUrl] = useState("");
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectError, setInspectError] = useState("");
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const urlInputRef = useRef(null);
  const changedWebsites = websites.filter((website) => website.status === "Changed");
  const errorWebsites = websites.filter((website) => website.status === "Error");
  const availableWebsites = websites.filter(
    (website) => (website.latestAvailabilityStatus || "unknown") === "available"
  );
  const priceAwareWebsites = websites.filter((website) => website.latestPrimaryPrice);
  const productWatchCount = websites.filter((website) => (website.watchType || "product") === "product").length;
  const pageWatchCount = websites.filter((website) => (website.watchType || "product") === "page").length;
  const mostRecentWebsite = [...websites].sort((left, right) => {
    const leftDate = new Date(left.lastChanged || left.lastChecked || left.createdAt || 0).getTime();
    const rightDate = new Date(right.lastChanged || right.lastChecked || right.createdAt || 0).getTime();
    return rightDate - leftDate;
  })[0];
  const checkedWebsites = websites.filter((website) => website.lastChecked);
  const historyReadyWebsite = websites.find(
    (website) => website.latestSnapshotText || website.lastChecked
  );
  const onboardingSteps = [
    {
      id: "add",
      title: "Add a product page",
      description: "Paste in a public product URL so Watchli can save the first snapshot.",
      done: websites.length > 0
    },
    {
      id: "check",
      title: "Run a manual check",
      description: "Use Check Now once to pull the first readable price and page details.",
      done: checkedWebsites.length > 0
    },
    {
      id: "history",
      title: "Open history and compare",
      description: "Review saved snapshots and the latest price movement from one place.",
      done: Boolean(historyReadyWebsite)
    },
    {
      id: "alerts",
      title: "Wait for alerts",
      description: "Watchli will only email you for price increases, drops, or out-of-stock changes.",
      done: checkedWebsites.length > 0
    }
  ];
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.done).length;
  const showOnboarding = !onboardingDismissed && websites.length < 3;
  const greetingName = account?.displayName || user?.displayName || user?.email || "";

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      setOnboardingDismissed(storedValue === "true");
    } catch (_error) {
      setOnboardingDismissed(false);
    }
  }, []);

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
      const payload = await createWebsite(normalizedUrl, watchType);
      trackEvent("add_website", {
        source: "dashboard",
        hostname: (() => {
          try {
            return new URL(normalizedUrl).hostname;
          } catch (_error) {
            return "";
          }
        })()
      });
      setAccount((current) => ({
        ...current,
        ...(payload.account || {})
      }));
      await loadWebsites({ showRefreshing: true });
      setSuccess("Website added to your dashboard.");
      setUrl("");
      setWatchType("product");
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
      trackEvent("check_now", {
        source: "dashboard",
        website_id: websiteId
      });
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

  const handleInspectWebsite = async (event) => {
    event.preventDefault();
    setInspectError("");
    setInspectResult(null);

    if (!isValidUrl(inspectUrl)) {
      setInspectError("Enter a full product URL starting with http:// or https://");
      return;
    }

    setInspectLoading(true);

    try {
      const result = await inspectWebsite(inspectUrl);
      trackEvent("inspect_website", {
        source: "dashboard",
        hostname: (() => {
          try {
            return new URL(inspectUrl).hostname;
          } catch (_error) {
            return "";
          }
        })(),
        result: result.ok
          ? result.productSignals?.primaryPrice
            ? "price_found"
            : result.diagnostic?.code || "loaded_without_price"
          : result.diagnostic?.code || "check_failed"
      });
      setInspectResult(result);
    } catch (requestError) {
      setInspectError(requestError.message || "Could not inspect this website.");
    } finally {
      setInspectLoading(false);
    }
  };

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);

    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch (_error) {
      // Ignore local storage errors so the guide can still close.
    }
  };

  const handleOnboardingAction = async () => {
    if (websites.length === 0) {
      urlInputRef.current?.focus();
      return;
    }

    if (!checkedWebsites.length) {
      await handleCheckWebsite(websites[0].id);
      return;
    }

    if (historyReadyWebsite) {
      await handleViewHistory(historyReadyWebsite);
      return;
    }

    urlInputRef.current?.focus();
  };

  const handleUpgradeFromDashboard = () => {
    trackEvent("upgrade_clicked", {
      source: "dashboard"
    });
    handleUpgradeClick();
  };

  const schedulerStatusLabel = scheduler?.running
    ? "Running now"
    : scheduler?.lastRunSucceeded
      ? "Healthy"
      : scheduler?.lastError
        ? "Needs attention"
        : "Waiting";
  const lastAlertLabel = scheduler?.lastAlertSentAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(scheduler.lastAlertSentAt))
    : "No alerts sent yet";
  const lastAlertTypeLabel =
    scheduler?.lastAlertType === "price_alert"
      ? "Price alert sent"
      : scheduler?.lastAlertType === "change_alert"
        ? "Change alert sent"
        : scheduler?.lastAlertType === "test_email"
          ? "Test email sent"
          : "Alert activity";
  const schedulerAlertEmail = String(scheduler?.lastAlertEmail || "").trim().toLowerCase();
  const signedInUserEmail = String(user?.email || "").trim().toLowerCase();
  const showSchedulerAlertEmail =
    Boolean(schedulerAlertEmail) &&
    Boolean(signedInUserEmail) &&
    schedulerAlertEmail === signedInUserEmail;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_360px] xl:items-start">
      <div className="space-y-5 sm:space-y-6">
        <section className="glass-panel rounded-[30px] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-amber-200">Dashboard</p>
              <h1 className="display-font mt-3 break-words text-2xl font-semibold text-white sm:text-3xl">
                Welcome back{greetingName ? `, ${greetingName}` : ""}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
                Track product pages, capture likely price signals, and review changes without digging through noisy page updates.
              </p>
            </div>
            <div className="data-chip w-fit rounded-full px-4 py-2 text-sm text-slate-100">
              {account.planLabel}
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleAddWebsite}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-200">Add Website</span>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWatchType("product")}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    watchType === "product"
                      ? "border-[#c9a37f]/18 bg-[#8d5b40]/20 text-amber-50"
                      : "border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  Product price watch
                </button>
                <button
                  type="button"
                  onClick={() => setWatchType("page")}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    watchType === "page"
                      ? "border-[#c9a37f]/18 bg-[#8d5b40]/20 text-amber-50"
                      : "border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  Website content watch
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder={watchType === "page" ? "https://example.com/announcements" : "https://store.com/product/example"}
                  className="w-full rounded-2xl border border-[#d3b697]/18 bg-[#f6eee5] px-4 py-3 text-[#2f2722] outline-none transition placeholder:text-[#8b7765] focus:border-[#b5835a]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="glow-button w-full rounded-2xl bg-[#3d6283] px-5 py-3 font-semibold text-white transition hover:bg-[#345571] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Adding..." : "Add Website"}
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {watchType === "page"
                  ? "Use content watch for blogs, updates pages, docs, or any website where you want to know when the readable text changes."
                  : "Use product price watch for shopping pages where Watchli should focus on price and availability changes."}
              </p>
            </label>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-100">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {account.websiteCount} of {account.websiteLimit} slots used
            </span>
            <span className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-amber-50">
              {account.checkFrequency}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {priceAwareWebsites.length} prices found
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              {pageWatchCount} content watches
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-sm leading-6 text-slate-100/90">
            Watchli sends product alerts for price increases, price drops, and sold-out changes. Website content watches send alerts when the page text changes.
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-200">Tracked pages</p>
              <p className="display-font mt-2 text-2xl font-semibold text-white">{websites.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-200">Product watches</p>
              <p className="display-font mt-2 text-2xl font-semibold text-white">{productWatchCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-200">Need attention</p>
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

          {showOnboarding ? (
            <div className="mt-5 rounded-[28px] border border-[#d3b697]/12 bg-white/[0.05] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-amber-50">
                    <Sparkles className="h-4 w-4" />
                    Getting started
                  </div>
                  <h2 className="display-font mt-3 text-xl font-semibold text-white">
                    Set up your first Watchli product watch
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
                    Add a product page, run one check, and open history once so you can see exactly
                    how Watchli tracks prices and listing changes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismissOnboarding}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-[#d3b697]/12 bg-white/[0.06] px-3 py-2 text-sm text-stone-100 transition hover:bg-white/[0.1]"
                >
                  <X className="h-4 w-4" />
                  Hide guide
                </button>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-4">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Step {index + 1}
                      </span>
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      ) : (
                        <CircleDashed className="h-5 w-5 text-amber-200" />
                      )}
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-200">
                  {completedOnboardingSteps} of {onboardingSteps.length} steps completed
                </p>
                <button
                  type="button"
                  onClick={() => void handleOnboardingAction()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#c9a37f]/18 bg-[#8d5b40]/88 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7b4d36]"
                >
                  {websites.length === 0
                    ? "Focus add website"
                    : !checkedWebsites.length
                      ? "Run first check"
                      : "Open history"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="display-font text-2xl font-semibold text-white">
                Your watched product pages
              </h2>
              <p className="mt-1 text-sm text-slate-200">
                {websites.length > 0
                  ? `Latest activity: ${mostRecentWebsite?.latestProductTitle || mostRecentWebsite?.url || "Tracked page"}`
                  : "Start by adding a product page you want Watchli to monitor."}
              </p>
            </div>
            <p className="text-sm text-slate-200">
              {availableWebsites.length} available now
            </p>
          </div>

          {loadingWebsites ? (
            <div className="glass-panel-soft rounded-3xl p-8 text-center text-slate-100">
              <div className="inline-flex items-center gap-2">
                <LoaderCircle className="h-5 w-5 animate-spin text-amber-200" />
                Loading your watched websites...
              </div>
            </div>
          ) : websites.length === 0 ? (
            <div className="glass-panel-soft rounded-3xl border border-dashed p-8 text-center">
              <p className="display-font text-2xl font-semibold text-white">No watched pages yet</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-100/90">
                Paste in a product page above and Watchli will save the first snapshot, detect likely prices,
                and keep checking for changes you care about.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm text-slate-100">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Add a public product URL
                </span>
                <span className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-amber-50">
                  Run manual checks anytime
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-left sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">1. Add a product page</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Paste in a public shopping or product URL into the field above.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">2. Run your first check</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Watchli saves a first snapshot and tries to detect the current price.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-medium text-white">3. Review history later</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Open history to compare changes and see whether price or stock moved.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
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
      </div>

      <aside className="space-y-3">
          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-200" />
              <div>
                <p className="text-sm text-slate-200">Compatibility tester</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  QA a real product page
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">
              Paste a live store link to see whether Watchli can detect the product title, price,
              source, and stock status before you rely on alerts.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleInspectWebsite}>
              <input
                type="url"
                value={inspectUrl}
                onChange={(event) => setInspectUrl(event.target.value)}
                placeholder="https://store.com/product/example"
                className="w-full rounded-2xl border border-[#d3b697]/18 bg-[#f6eee5] px-4 py-3 text-[#2f2722] outline-none transition placeholder:text-[#8b7765] focus:border-[#b5835a]"
              />
              <button
                type="submit"
                disabled={inspectLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a37f]/18 bg-[#8d5b40]/88 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7b4d36] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {inspectLoading ? "Checking store..." : "Test compatibility"}
              </button>
            </form>

            {!inspectResult && !inspectError ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium text-white">What you’ll see here</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Watchli will show whether the page loaded, whether it found a likely price,
                  what source that price came from, and whether the item appears available.
                </p>
              </div>
            ) : null}

            {inspectError ? (
              <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {inspectError}
              </p>
            ) : null}

            {inspectResult ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded-full border px-3 py-1.5 ${
                    inspectResult.ok
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : "border-rose-400/20 bg-rose-500/10 text-rose-100"
                  }`}>
                    {inspectResult.ok ? "Store reachable" : "Check failed"}
                  </span>
                  {inspectResult.productSignals?.primaryPrice ? (
                    <span className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-amber-50">
                      Price found
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {inspectResult.ok
                    ? inspectResult.summary
                    : inspectResult.error}
                </p>

                {inspectResult.diagnostic ? (
                  <div className={`mt-4 rounded-2xl border p-4 ${
                    inspectResult.ok
                      ? "border-amber-300/18 bg-amber-300/10"
                      : "border-rose-400/25 bg-rose-500/10"
                  }`}>
                    <p className={`text-sm font-medium ${
                      inspectResult.ok ? "text-amber-100" : "text-rose-100"
                    }`}>
                      {inspectResult.diagnostic.title}
                    </p>
                    <p className={`mt-2 text-sm leading-6 ${
                      inspectResult.ok ? "text-amber-50/90" : "text-rose-100/90"
                    }`}>
                      {inspectResult.diagnostic.detail}
                    </p>
                  </div>
                ) : null}

                {inspectResult.ok ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Product title</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {inspectResult.productSignals?.productTitle || "Not detected"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Detected price</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {inspectResult.productSignals?.primaryPrice || "No reliable price yet"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Price source</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {inspectResult.productSignals?.primaryPriceSource || "No source"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm text-slate-300">Availability</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {inspectResult.productSignals?.availabilityLabel || "Unknown"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-amber-200 ${scheduler?.running ? "animate-spin" : ""}`} />
              <div>
                <p className="text-sm text-slate-200">Automatic checks</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  {schedulerStatusLabel}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">
              {scheduler?.lastError
                ? `Last scheduler issue: ${scheduler.lastError}`
                : scheduler?.lastCompletedAt
                  ? `Last completed: ${new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(scheduler.lastCompletedAt))}`
                  : "Automatic checks will appear here after the first scheduled run."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-100">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {scheduler?.lastRunTotal || 0} checked
              </span>
              <span className="rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/20 px-3 py-1.5 text-amber-50">
                {scheduler?.lastRunChanged || 0} changed
              </span>
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-rose-100">
                {scheduler?.lastRunFailed || 0} failed
              </span>
              {scheduler?.nextRunAt ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Next run {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit"
                  }).format(new Date(scheduler.nextRunAt))}
                </span>
              ) : null}
              {scheduler?.lastDurationMs ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  {(scheduler.lastDurationMs / 1000).toFixed(1)}s runtime
                </span>
              ) : null}
            </div>
            <div className="mt-4 rounded-2xl border border-[#d3b697]/12 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-stone-300">{lastAlertTypeLabel}</p>
                  <p className="mt-1 text-base font-semibold text-white">{lastAlertLabel}</p>
                </div>
                {showSchedulerAlertEmail ? (
                  <span className="rounded-full border border-[#d3b697]/14 bg-white/[0.05] px-3 py-1.5 text-xs text-stone-200">
                    {scheduler.lastAlertEmail}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {scheduler?.lastAlertSubject
                  ? `Latest subject: ${scheduler.lastAlertSubject}`
                  : "When Watchli sends a real product alert or a test email, the latest activity will show here."}
                {!showSchedulerAlertEmail && scheduler?.lastAlertEmail
                  ? " Recipient hidden because the latest scheduler alert was sent to a different account."
                  : ""}
              </p>
            </div>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-200" />
              <div>
                <p className="text-sm text-slate-200">Quick actions</p>
                <h2 className="display-font text-xl font-semibold text-white">
                  Keep the account moving
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-100/90">
              {errorWebsites.length > 0
                ? `${errorWebsites.length} watch${errorWebsites.length === 1 ? "" : "es"} need another check.`
                : changedWebsites.length > 0
                  ? `${changedWebsites.length} watch${changedWebsites.length === 1 ? "" : "es"} changed recently.`
                  : "Everything is looking steady right now."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingEmail}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d3b697]/12 bg-white/[0.06] px-4 py-3 text-sm text-stone-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {sendingEmail ? "Sending..." : "Send Test Email"}
              </button>
              <button
                type="button"
                onClick={() => void loadWebsites({ showRefreshing: true })}
                disabled={refreshingWebsites || loadingWebsites}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d3b697]/12 bg-white/[0.06] px-4 py-3 text-sm text-stone-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingWebsites ? "animate-spin" : ""}`} />
                Refresh dashboard
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-200" />
                <div>
                  <p className="text-sm text-slate-200">Plan</p>
                  <h2 className="display-font text-lg font-semibold text-white">
                    {account.premium ? "Watchli Pro" : "Free plan"}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-100/90">
                {account.premium
                  ? "Manage your subscription and keep room for more watched products."
                  : "Upgrade when you want more watched pages and premium plan headroom."}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleUpgradeFromDashboard}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a37f]/18 bg-[#8d5b40]/88 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7b4d36]"
                >
                  <Zap className="h-4 w-4" />
                  {account.premium ? "View Pro plan" : "Upgrade to Pro"}
                </button>
                {account.premium ? (
                  <button
                    type="button"
                    onClick={() => void handleManageBilling()}
                    disabled={openingBilling}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d3b697]/12 bg-white/[0.06] px-4 py-3 text-sm text-stone-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingBilling ? "Opening..." : "Manage Billing"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
      </aside>

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
