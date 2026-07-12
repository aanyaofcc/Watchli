import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Crown,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { BrandLogoLink } from "../components/BrandLogo";
import { SiteFooterDense } from "../components/SiteFooterDense";

const steps = [
  {
    title: "Paste a product URL",
    body: "Drop in a product or shopping page you want to keep an eye on."
  },
  {
    title: "We watch the listing",
    body: "Watchli saves the page text, looks for likely prices, and compares future checks."
  },
  {
    title: "Get a price-change alert",
    body: "If the product price or key listing details change, you get an email instead of checking manually."
  }
];

const features = [
  {
    icon: Globe,
    title: "Price-focused tracking",
    body: "Built for shopping and product pages where the biggest question is usually simple: did the price change?"
  },
  {
    icon: LayoutDashboard,
    title: "Snapshot-first dashboard",
    body: "See what changed, the latest detected price, and the before-and-after text from one clean control panel."
  },
  {
    icon: ShieldCheck,
    title: "Simple, trustworthy stack",
    body: "Firebase auth, Firestore storage, and dependable email alerts without unnecessary moving parts."
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For shoppers and small teams tracking a few important product pages.",
    features: ["5 product pages", "Email alerts", "Daily checks"]
  },
  {
    name: "Pro",
    price: "$7/mo",
    description: "For heavier price monitoring with more tracked items and the first paid Watchli tier.",
    features: ["100 product pages", "Billing portal", "Premium roadmap access"]
  }
];

const dashboardPreview = [
  { label: "Headphones", url: "store.com/products/headphones", status: "Watching" },
  { label: "Sneakers", url: "shop.com/items/sneakers", status: "Changed" },
  { label: "Monitor", url: "market.com/products/monitor", status: "Watching" }
];

export function LandingPagePro() {
  return (
    <div className="tech-shell min-h-screen text-white">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-cyan-400/30" />
      <div className="aurora-orb right-[-60px] top-36 h-72 w-72 bg-blue-500/25" />
      <div className="aurora-orb bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 bg-teal-300/15" />

      <header className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:py-5">
        <BrandLogoLink to="/" size="hero" />

        <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Link
            to="/login"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-slate-100 transition hover:bg-white/10"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="glow-button rounded-full bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-5 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2]"
          >
            Start Watching
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
          <div className="max-w-2xl lg:max-w-[36rem]">
            <div className="data-chip inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span className="truncate sm:whitespace-normal">Track product pages and catch price changes faster</span>
            </div>

            <h1 className="display-font mt-6 max-w-3xl text-4xl font-bold leading-[0.98] tracking-tight text-white sm:mt-8 sm:text-6xl lg:text-[4.5rem]">
              Catch price drops, sellouts, and product changes before everyone else.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg sm:leading-8">
              Watchli monitors shopping and product pages, looks for likely prices, and
              tells you when the listing changes so you can catch drops, increases, or edits quickly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="glow-button inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] px-6 py-3.5 font-semibold text-slate-950 transition hover:scale-[1.02] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2]"
              >
                Start Watching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-white transition hover:bg-white/10"
              >
                Log In
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {[
                ["5 products free", "Start with the items you care about most"],
                ["Price-aware alerts", "Get notified when a product page appears to change price"],
                ["Cron-ready backend", "Prepared for automatic checks later"]
              ].map(([title, body]) => (
                <div key={title} className="glass-panel-soft rounded-3xl p-4 sm:p-5">
                  <p className="display-font text-lg font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="glass-panel rounded-[28px] p-3 sm:rounded-[34px] sm:p-4">
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,33,53,0.94),rgba(14,25,42,0.8))] p-4 sm:rounded-[28px] sm:p-5 lg:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">
                      Live overview
                    </p>
                    <h2 className="display-font mt-2 text-xl font-bold text-white sm:text-2xl">
                      Monitoring dashboard
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/20 sm:h-12 sm:w-12">
                    <BellRing className="h-5 w-5 text-cyan-200" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.16fr_0.84fr]">
                  <div className="glass-panel-soft rounded-3xl p-4 sm:p-5">
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Tracked pages</span>
                      <span className="display-font text-lg font-semibold text-white">3</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dashboardPreview.map((item) => (
                        <div
                          key={item.url}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm text-slate-400">{item.label}</p>
                              <p className="break-all text-sm text-white sm:truncate">{item.url}</p>
                            </div>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "Changed"
                                  ? "bg-amber-400/15 text-amber-200"
                                  : "bg-emerald-400/15 text-emerald-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 content-start">
                    <div className="glass-panel-soft rounded-3xl p-5">
                      <p className="text-sm text-slate-400">Latest signal</p>
                      <p className="mt-3 display-font text-xl font-bold text-white sm:text-2xl">
                        Sneaker price updated
                      </p>
                      <p className="mt-4 text-sm leading-7 text-slate-300">
                        Watchli detected a likely price change on a watched product page and queued an alert.
                      </p>
                    </div>

                    <div className="glass-panel-soft rounded-3xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-cyan-300/10 p-3">
                          <Zap className="h-5 w-5 text-cyan-200" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">How it works</p>
                          <p className="mt-1 text-sm leading-7 text-white sm:text-base">
                            Readable text + price signals + change compare
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">How it works</p>
            <h2 className="display-font mt-3 text-3xl font-bold text-white sm:text-4xl">
              Focus on product pages where price changes matter
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="glass-panel rounded-[30px] p-5 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/25 to-blue-400/20 text-lg font-bold text-cyan-100">
                  {index + 1}
                </div>
                <h3 className="display-font mt-6 text-2xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-panel-soft rounded-[30px] p-5 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-cyan-200" />
                </div>
                <h3 className="display-font mt-5 text-2xl font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Pricing preview</p>
              <h2 className="display-font mt-3 text-3xl font-bold text-white sm:text-4xl">
                Start with a few products, scale later
              </h2>
            </div>
            <p className="max-w-2xl text-slate-300">
              The MVP stays simple, but the structure is ready for more tracked products,
              faster checks, and Stripe billing when you want to grow.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`rounded-[32px] p-[1px] ${
                  index === 0
                    ? "bg-gradient-to-br from-cyan-300/40 via-white/10 to-white/5"
                    : "bg-gradient-to-br from-white/10 to-white/5"
                }`}
              >
                <div className="glass-panel h-full rounded-[31px] p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                        {plan.name}
                      </p>
                      <h3 className="display-font mt-3 text-3xl font-bold text-white sm:text-4xl">
                        {plan.price}
                      </h3>
                      <p className="mt-3 max-w-md text-slate-300">{plan.description}</p>
                    </div>
                    {index === 0 ? (
                      <span className="rounded-full bg-cyan-300/12 px-3 py-1 text-xs font-semibold text-cyan-200">
                        Best for MVP
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-100">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <Link
                      to={index === 0 ? "/signup" : "/upgrade"}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                        index === 0
                          ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          : "bg-gradient-to-r from-[#8fb2c3] via-[#7f9fb7] to-[#8cb4a8] text-slate-950 hover:scale-[1.01] hover:from-[#9bbccc] hover:via-[#8aabc2] hover:to-[#96beb2]"
                      }`}
                    >
                      {index === 0 ? "Start Free" : "See Pro"}
                      {index === 1 ? <Crown className="h-4 w-4" /> : null}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooterDense />
    </div>
  );
}
