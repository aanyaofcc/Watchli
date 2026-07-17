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

export function LandingPage() {
  return (
    <div className="tech-shell min-h-screen text-white">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-cyan-400/30" />
      <div className="aurora-orb right-[-60px] top-36 h-72 w-72 bg-blue-500/25" />
      <div className="aurora-orb bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 bg-teal-300/15" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogoLink to="/" size="hero" />

        <div className="hidden items-center gap-6 text-sm font-medium text-white md:flex">
          <a href="#how-it-works" className="transition hover:text-cyan-50">
            How it works
          </a>
          <a href="#pricing" className="transition hover:text-cyan-50">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_rgba(31,45,61,0.16)] transition hover:bg-white/18"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="glow-button rounded-full bg-gradient-to-r from-[#35506b] via-[#3f6385] to-[#4d7596] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:from-[#2f485f] hover:via-[#395a78] hover:to-[#456b8c]"
          >
            Start Watching
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="data-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-100">
              <Sparkles className="h-4 w-4 text-cyan-100" />
              Track product pages and catch price changes faster
            </div>

            <h1 className="display-font mt-8 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A glossy price watcher for products you do not want to miss.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100">
              Watchli monitors shopping and product pages, looks for likely prices, and
              tells you when the listing changes so you can catch drops, increases, or edits quickly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="glow-button inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#35506b] via-[#3f6385] to-[#4d7596] px-6 py-3.5 font-semibold text-white transition hover:scale-[1.02] hover:from-[#2f485f] hover:via-[#395a78] hover:to-[#456b8c]"
              >
                Start Watching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/12 px-6 py-3.5 font-medium text-white shadow-[0_8px_18px_rgba(31,45,61,0.16)] transition hover:bg-white/18"
              >
                Log In
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["5 products free", "Start with the items you care about most"],
                ["Price-aware alerts", "Get notified when a product page appears to change price"],
                ["Cron-ready backend", "Prepared for automatic checks later"]
              ].map(([title, body]) => (
                <div key={title} className="glass-panel-soft rounded-3xl p-4">
                  <p className="display-font text-lg font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100/90">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="glass-panel rounded-[34px] p-5">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,30,0.95),rgba(8,15,26,0.82))] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/90">
                      Live overview
                    </p>
                    <h2 className="display-font mt-2 text-2xl font-bold text-white">
                      Monitoring dashboard
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
                    <BellRing className="h-5 w-5 text-cyan-200" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="glass-panel-soft rounded-3xl p-5">
                    <div className="flex items-center justify-between text-sm text-slate-100/90">
                      <span>Tracked pages</span>
                      <span className="display-font text-lg font-semibold text-white">3</span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {dashboardPreview.map((item) => (
                        <div
                          key={item.url}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm text-slate-200">{item.label}</p>
                              <p className="truncate text-sm text-white">{item.url}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

                  <div className="space-y-4">
                    <div className="glass-panel-soft rounded-3xl p-5">
                      <p className="text-sm text-slate-200">Latest signal</p>
                      <p className="mt-3 display-font text-2xl font-bold text-white">
                        Sneaker price updated
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-100/90">
                        Watchli detected a likely price change on a watched product page and queued an alert.
                      </p>
                    </div>

                    <div className="glass-panel-soft rounded-3xl p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-cyan-300/10 p-3">
                          <Zap className="h-5 w-5 text-cyan-200" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-200">How it works</p>
                          <p className="text-white">Readable text + price signals + change compare</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">How it works</p>
            <h2 className="display-font mt-3 text-4xl font-bold text-white">
              Focus on product pages where price changes matter
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="glass-panel rounded-[30px] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/25 to-blue-400/20 text-lg font-bold text-cyan-100">
                  {index + 1}
                </div>
                <h3 className="display-font mt-6 text-2xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-100/90">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-panel-soft rounded-[30px] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-cyan-200" />
                </div>
                <h3 className="display-font mt-5 text-2xl font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-100/90">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 pb-24">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Pricing preview</p>
              <h2 className="display-font mt-3 text-4xl font-bold text-white">
                Start with a few products, scale later
              </h2>
            </div>
            <p className="max-w-2xl text-slate-100/90">
              The MVP stays simple, but the structure is ready for more tracked products,
              faster checks, and Stripe billing when you want to grow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`rounded-[32px] p-[1px] ${
                  index === 0
                    ? "bg-gradient-to-br from-cyan-300/40 via-white/10 to-white/5"
                    : "bg-gradient-to-br from-white/10 to-white/5"
                }`}
              >
                <div className="glass-panel h-full rounded-[31px] p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-200">
                        {plan.name}
                      </p>
                      <h3 className="display-font mt-3 text-4xl font-bold text-white">
                        {plan.price}
                      </h3>
                      <p className="mt-3 max-w-md text-slate-100/90">{plan.description}</p>
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
                          : "bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-300 text-slate-950 hover:scale-[1.01]"
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

        <footer className="mx-auto max-w-7xl border-t border-white/12 px-6 py-8 text-sm text-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 Watchli. Monitor product pages and get alerts when they change. Contact:{" "}
              <a className="text-cyan-200 hover:text-cyan-100" href="mailto:contactwatchli@gmail.com">
                contactwatchli@gmail.com
              </a>
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
