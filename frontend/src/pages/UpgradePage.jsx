import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crown, LoaderCircle, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createBillingPortalSession, createCheckoutSession, fetchMyWebsites } from "../lib/api";

const perks = [
  "Up to 100 watched product pages",
  "Priority checks as the paid tier expands",
  "Stripe billing and subscription management",
  "Future premium alerting features"
];

export function UpgradePage() {
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState("");

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
          setError(loadError.message || "Could not load billing details.");
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

  const checkoutState = searchParams.get("checkout");

  const handleUpgrade = async () => {
    setError("");
    setCheckingOut(true);

    try {
      const payload = await createCheckoutSession();
      window.location.href = payload.url;
    } catch (requestError) {
      setError(requestError.message || "Could not start Stripe checkout.");
      setCheckingOut(false);
    }
  };

  const handleManageBilling = async () => {
    setError("");
    setOpeningPortal(true);

    try {
      const payload = await createBillingPortalSession();
      window.location.href = payload.url;
    } catch (requestError) {
      setError(requestError.message || "Could not open the billing portal.");
      setOpeningPortal(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Upgrade</p>
          <h1 className="display-font mt-3 text-4xl font-semibold text-white">
            Watchli Pro
          </h1>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      {checkoutState === "success" ? (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          Stripe checkout finished. If your payment completed, your plan should update to Pro as soon as the webhook arrives.
        </div>
      ) : null}

      {checkoutState === "cancelled" ? (
        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Checkout was cancelled. You can come back anytime to upgrade.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-panel-soft rounded-3xl p-5">
          <p className="text-sm text-slate-400">Monthly price</p>
          <p className="display-font mt-2 text-3xl font-semibold text-white">$7</p>
          <p className="mt-2 text-sm text-slate-300">Straightforward monthly billing</p>
        </div>
        <div className="glass-panel-soft rounded-3xl p-5">
          <p className="text-sm text-slate-400">Watch limit</p>
          <p className="display-font mt-2 text-3xl font-semibold text-white">100</p>
          <p className="mt-2 text-sm text-slate-300">Tracked product pages on Pro</p>
        </div>
        <div className="glass-panel-soft rounded-3xl p-5">
          <p className="text-sm text-slate-400">Priority</p>
          <p className="display-font mt-2 text-3xl font-semibold text-white">Faster</p>
          <p className="mt-2 text-sm text-slate-300">Positioned for premium checks as Watchli grows</p>
        </div>
        <div className="glass-panel-soft rounded-3xl p-5">
          <p className="text-sm text-slate-400">Best for</p>
          <p className="display-font mt-2 text-3xl font-semibold text-white">Power users</p>
          <p className="mt-2 text-sm text-slate-300">Shoppers and researchers watching more products</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel rounded-[32px] p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Built for shoppers and price tracking power users
          </div>

          <h2 className="display-font mt-6 text-5xl font-semibold text-white">
            $7<span className="text-2xl text-slate-400">/month</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Pro gives Watchli a real paid tier: more watched products, billing support,
            and room for faster checks as the monitoring engine grows.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">What changes right away</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your watch limit jumps from 5 to 100 and the app starts treating your account as Pro across the dashboard.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">What comes next</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Premium plan groundwork is ready for faster checks, richer alerting, and more serious monitoring workflows.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {perks.map((perk) => (
              <div
                key={perk}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-slate-200"
              >
                <Check className="h-4 w-4 text-cyan-300" />
                {perk}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={checkingOut || loading || account?.premium}
              className="glow-button inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {account?.premium ? "You are on Pro" : checkingOut ? "Opening checkout..." : "Upgrade to Pro"}
            </button>

            <button
              type="button"
              onClick={handleManageBilling}
              disabled={openingPortal || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {openingPortal ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Manage Billing
            </button>
          </div>
        </div>

        <div className="glass-panel-soft rounded-[32px] p-8">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-slate-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
              Loading billing details...
            </div>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current plan</p>
              <h2 className="display-font mt-3 text-3xl font-semibold text-white">
                {account?.planLabel || "Free plan"}
              </h2>
              <p className="mt-4 text-slate-300">
                {account?.premium
                  ? "Your account is already unlocked for Pro limits."
                  : "You are currently on the free plan with the starter limit."}
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Watched products</p>
                  <p className="display-font mt-2 text-2xl font-semibold text-white">
                    {account?.websiteCount || 0} / {account?.websiteLimit || 5}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Check cadence</p>
                  <p className="display-font mt-2 text-2xl font-semibold text-white">
                    {account?.checkFrequency || "Daily checks"}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-slate-400">Upgrade outcome</p>
                  <p className="display-font mt-2 text-2xl font-semibold text-white">
                    {account?.premium ? "Pro unlocked" : "Free starter tier"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {account?.premium
                      ? "Your account is using premium limits and billing management."
                      : "Upgrade when you need more tracked products and a stronger monitoring setup."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
