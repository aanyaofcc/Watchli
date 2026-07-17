import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MailCheck,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  createBillingPortalSession,
  createCheckoutSession,
  deleteAccount,
  fetchMyWebsites,
  updateNotificationPreferences
} from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  paused: false,
  priceIncrease: true,
  priceDecrease: true,
  outOfStock: true
};

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(date);
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, resetPassword, logout } = useAuth();
  const [account, setAccount] = useState(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [openingBilling, setOpeningBilling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  const confirmationTarget = user?.email || user?.uid || "";
  const usagePercent = useMemo(() => {
    const limit = account?.websiteLimit || 0;

    if (!limit) {
      return 0;
    }

    return Math.min(100, Math.round(((account?.websiteCount || 0) / limit) * 100));
  }, [account?.websiteCount, account?.websiteLimit]);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const payload = await fetchMyWebsites();

        if (active) {
          setAccount(payload.account || null);
          setNotificationPreferences(
            payload.account?.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
          );
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load account settings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
  }, [user?.displayName]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      setSuccess("Profile updated.");
    } catch (saveError) {
      setError(saveError.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError("No account email found for password reset.");
      return;
    }

    setError("");
    setSuccess("");
    setSendingReset(true);

    try {
      await resetPassword(user.email);
      setSuccess("Password reset email sent. Check your inbox, and look in spam or junk if you do not see it.");
    } catch (resetError) {
      setError(resetError.message || "Could not send password reset email.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleManageBilling = async () => {
    setError("");
    setSuccess("");
    setOpeningBilling(true);

    try {
      const payload = await createBillingPortalSession();
      window.location.href = payload.url;
    } catch (billingError) {
      setError(billingError.message || "Could not open billing portal.");
      setOpeningBilling(false);
    }
  };

  const handleUpgrade = async () => {
    setError("");
    setSuccess("");
    setCheckingOut(true);

    try {
      const payload = await createCheckoutSession();
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError.message || "Could not start checkout.");
      setCheckingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    setSuccess("");

    if (!confirmationTarget) {
      setError("Could not verify this account for deletion.");
      return;
    }

    if (deleteConfirmation.trim() !== confirmationTarget) {
      setError(`Type ${confirmationTarget} exactly to confirm account deletion.`);
      return;
    }

    setDeletingAccount(true);

    try {
      await deleteAccount(deleteConfirmation.trim());

      try {
        await logout();
      } catch {
        // Ignore local sign-out errors after the auth record is removed.
      }

      navigate("/", {
        replace: true,
        state: { deletedAccount: true }
      });
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete your account.");
      setDeletingAccount(false);
    }
  };

  const handleNotificationToggle = async (key, value) => {
    setError("");
    setSuccess("");
    setSavingNotifications(true);

    const nextPreferences = {
      ...notificationPreferences,
      [key]: value
    };

    setNotificationPreferences(nextPreferences);

    try {
      const payload = await updateNotificationPreferences(nextPreferences);
      const savedPreferences =
        payload.notificationPreferences || nextPreferences;
      setNotificationPreferences(savedPreferences);
      setAccount((current) =>
        current
          ? {
              ...current,
              notificationPreferences: savedPreferences
            }
          : current
      );
      setSuccess("Email alert preferences updated.");
    } catch (saveError) {
      setNotificationPreferences(notificationPreferences);
      setError(saveError.message || "Could not update email alert preferences.");
    } finally {
      setSavingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Settings</p>
            <h1 className="display-font mt-3 text-3xl font-semibold text-white">
              Manage your account, profile, and subscription
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-100 sm:text-base">
              Update your profile details, review your plan, manage billing, and keep your
              Watchli account under control from one place.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-200">Account health</p>
                <h2 className="display-font mt-2 text-2xl font-semibold text-white">Your Watchli workspace</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
                <Sparkles className="h-4 w-4" />
                {account?.planLabel || "Free plan"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Tracked products</p>
                <p className="display-font mt-2 text-2xl font-semibold text-white">{account?.websiteCount || 0}</p>
                <p className="mt-2 text-sm text-slate-300">Currently active in your dashboard</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Available slots</p>
                <p className="display-font mt-2 text-2xl font-semibold text-white">{account?.websiteSlotsRemaining ?? 5}</p>
                <p className="mt-2 text-sm text-slate-300">Remaining before you hit your limit</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Check cadence</p>
                <p className="display-font mt-2 text-2xl font-semibold text-white">{account?.checkFrequency || "Daily"}</p>
                <p className="mt-2 text-sm text-slate-300">How often Watchli is set to check</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">Plan usage</span>
                <span className="text-slate-200">
                  {account?.websiteCount || 0} / {account?.websiteLimit || 5}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-200"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/10 p-3">
                <UserRound className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-sm text-slate-200">Profile</p>
                <h2 className="display-font text-xl font-semibold text-white">Your account details</h2>
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSaveProfile}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Display name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-200">Email</span>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-300 outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={savingProfile}
                className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#35506b] via-[#3f6385] to-[#4d7596] px-5 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-[#2f485f] hover:via-[#395a78] hover:to-[#456b8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save profile
              </button>
            </form>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <MailCheck className="h-5 w-5 text-slate-100" />
              </div>
              <div>
                <p className="text-sm text-slate-200">Email alerts</p>
                <h2 className="display-font text-xl font-semibold text-white">Alert rules and preferences</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-100/90">
              Watchli sends emails only when a tracked product price increases, decreases, or the product goes out of stock or becomes unavailable.
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  key: "paused",
                  label: "Pause all alert emails",
                  description: "Keep tracking active in the dashboard, but stop all notification emails for now."
                },
                {
                  key: "priceIncrease",
                  label: "Email me when price increases",
                  description: "Useful if you want to know when a product starts getting more expensive."
                },
                {
                  key: "priceDecrease",
                  label: "Email me when price decreases",
                  description: "Useful for catching deals, markdowns, and sale price drops."
                },
                {
                  key: "outOfStock",
                  label: "Email me when item goes out of stock",
                  description: "Useful for spotting when an item sells out or becomes unavailable."
                }
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(notificationPreferences[item.key])}
                    disabled={savingNotifications}
                    onChange={(event) => {
                      void handleNotificationToggle(item.key, event.target.checked);
                    }}
                    className="mt-1 h-5 w-5 rounded border-white/20 bg-slate-950/40 text-cyan-300 focus:ring-cyan-300"
                  />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-200">
              {savingNotifications
                ? "Saving your alert preferences..."
                : "These preferences apply to Watchli product alerts across your account."}
            </p>
          </div>

          <div className="rounded-3xl border border-rose-400/25 bg-[linear-gradient(180deg,rgba(127,29,29,0.22),rgba(69,10,10,0.14))] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500/15 p-3">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
              </div>
              <div>
                <p className="text-sm text-rose-200/80">Danger zone</p>
                <h2 className="display-font text-xl font-semibold text-white">Delete account</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-200">
              This permanently removes your Watchli account, tracked websites, saved snapshots, and profile data.
              {account?.premium
                ? " If you have an active Pro subscription, Watchli will attempt to cancel it during deletion."
                : ""}
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm text-rose-100">
                Type <span className="font-semibold text-white">{confirmationTarget}</span> to confirm
              </span>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder={confirmationTarget}
                className="w-full rounded-2xl border border-rose-300/20 bg-slate-950/55 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-rose-300"
              />
            </label>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/90 px-5 py-3 font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingAccount ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete account permanently
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-[32px] p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Subscription and plan
            </div>

            {loading ? (
              <div className="mt-6 inline-flex items-center gap-2 text-slate-300">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
                Loading account details...
              </div>
            ) : (
              <>
                <h2 className="display-font mt-5 text-4xl font-semibold text-white">
                  {account?.planLabel || "Free plan"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  {account?.premium
                    ? "Your account is currently unlocked for Watchli Pro limits and billing management."
                    : "You're on the free plan right now. Upgrade when you want more tracked products and room to scale."}
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Plan limit</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.websiteLimit || 5}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Watched products allowed</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Current usage</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.websiteCount || 0}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Products currently tracked</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Check cadence</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.checkFrequency || "Daily"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Current plan pacing</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 xl:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-200">Billing experience</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {account?.premium
                        ? "Your subscription is active and ready to manage through the customer billing portal."
                        : "You are currently on free access. Upgrade when you want more tracked pages and premium plan headroom."}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-200">Reset email branding</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Firebase sends password reset emails. For the most trustworthy look, customize the email template in Firebase Console and keep your Watchli sender branding consistent.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-200">Recommended next steps</p>
                  <div className="mt-3 grid gap-3 xl:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                      <p className="text-sm font-medium text-white">Improve account trust</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Keep your display name updated and customize Firebase auth emails so support and branding match Watchli.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                      <p className="text-sm font-medium text-white">Stay on top of billing</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        If you move to Pro, use the billing portal here to manage payment details and subscriptions in one place.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {account?.premium ? (
                    <button
                      type="button"
                      onClick={handleManageBilling}
                      disabled={openingBilling}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {openingBilling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Manage subscription
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={checkingOut}
                      className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#35506b] via-[#3f6385] to-[#4d7596] px-5 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-[#2f485f] hover:via-[#395a78] hover:to-[#456b8c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checkingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Upgrade to Pro
                    </button>
                  )}
                  <Link
                    to="/upgrade"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-200 transition hover:bg-white/10"
                  >
                    View upgrade page
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck className="h-5 w-5 text-slate-100" />
              </div>
              <div>
                <p className="text-sm text-slate-200">Security</p>
                <h2 className="display-font text-xl font-semibold text-white">Password and access</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Need to change your password? Send yourself a secure reset email to the address on your account.
            </p>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={sendingReset}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingReset ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
              Send password reset email
            </button>
            <p className="mt-3 text-xs leading-6 text-slate-200">
              Reset emails return to your Watchli login page after the password update. If the email does not appear right away, check spam or junk.
            </p>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <MailCheck className="h-5 w-5 text-slate-100" />
              </div>
              <div>
                <p className="text-sm text-slate-200">Account overview</p>
                <h2 className="display-font text-xl font-semibold text-white">Identity and support</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Account email</p>
                <p className="mt-2 break-all text-sm text-white">{user?.email || "Not available"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-200">Member since</p>
                <p className="mt-2 text-sm text-white">{formatDate(user?.metadata?.creationTime)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Want more branded password reset emails? Update the Firebase Authentication email template so the sender name, support links, and copy match Watchli.
            </p>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/10 p-3">
                <MailCheck className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-sm text-slate-200">Alert reminders</p>
                <h2 className="display-font text-xl font-semibold text-white">How Watchli contacts you</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-medium text-white">Price goes up</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Get notified when a tracked item becomes more expensive.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-medium text-white">Price goes down</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Catch sale drops and markdowns without checking manually.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-medium text-white">Stock disappears</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Watchli can alert you when a product sells out or becomes unavailable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
