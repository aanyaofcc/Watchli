import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, LoaderCircle, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase";
import { createBillingPortalSession, createCheckoutSession, fetchMyWebsites } from "../lib/api";
import { useAuth } from "../providers/AuthProvider";

export function SettingsPage() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [openingBilling, setOpeningBilling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const payload = await fetchMyWebsites();

        if (active) {
          setAccount(payload.account || null);
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
      await sendPasswordResetEmail(auth, user.email);
      setSuccess("Password reset email sent.");
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

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Settings</p>
            <h1 className="display-font mt-3 text-3xl font-semibold text-white">
              Manage your account, profile, and subscription
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
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

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-300/10 p-3">
                <UserRound className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Profile</p>
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
                className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save profile
              </button>
            </form>
          </div>

          <div className="glass-panel-soft rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck className="h-5 w-5 text-slate-100" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Security</p>
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
                    <p className="text-sm text-slate-400">Plan limit</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.websiteLimit || 5}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Watched products allowed</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Current usage</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.websiteCount || 0}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Products currently tracked</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Check cadence</p>
                    <p className="display-font mt-2 text-2xl font-semibold text-white">
                      {account?.checkFrequency || "Daily"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">Current plan pacing</p>
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
                      className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2] disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </section>
    </div>
  );
}
