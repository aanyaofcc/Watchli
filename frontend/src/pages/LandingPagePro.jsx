import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Crown,
  Globe,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { BrandLogoLink } from "../components/BrandLogo";
import { SiteFooterDense } from "../components/SiteFooterDense";
import { sendFeedback } from "../lib/api";

const steps = [
  {
    title: "Paste a product URL",
    body: "Add the product page you care about and let Watchli keep the tab open for you."
  },
  {
    title: "We watch the listing",
    body: "Watchli captures the readable page content, looks for likely prices, and compares future checks."
  },
  {
    title: "Get a useful alert",
    body: "You only hear from Watchli when a product price moves or the listing becomes unavailable."
  }
];

const features = [
  {
    icon: Globe,
    title: "Made for product pages",
    body: "Built around shopping pages where price changes, stock changes, and listing edits matter most."
  },
  {
    icon: LayoutDashboard,
    title: "Clean watch dashboard",
    body: "Review tracked pages, price signals, and status updates from one simple control surface."
  },
  {
    icon: ShieldCheck,
    title: "Trustworthy by design",
    body: "Firebase, Firestore, email alerts, and a straightforward monitoring flow without extra clutter."
  }
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "A simple starting point for shoppers tracking a handful of product pages.",
    features: ["3 watched product pages", "Email alerts", "Daily checks"]
  },
  {
    name: "Pro",
    price: "$7/mo",
    description: "For people tracking more products and wanting room to scale with Watchli.",
    features: ["100 watched pages", "Billing portal", "Premium feature path"]
  }
];

const dashboardPreview = [
  { label: "Headphones", url: "store.com/products/headphones", status: "Watching" },
  { label: "Sneakers", url: "shop.com/items/sneakers", status: "Changed" },
  { label: "Monitor", url: "market.com/products/monitor", status: "Watching" }
];

const heroMetrics = [
  { label: "Free plan", value: "3 pages" },
  { label: "Core signal", value: "Price alerts" },
  { label: "Check style", value: "Daily by default" }
];

export function LandingPagePro() {
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    message: "",
    website: ""
  });
  const [feedbackStatus, setFeedbackStatus] = useState({
    type: "",
    message: ""
  });
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  async function handleFeedbackSubmit(event) {
    event.preventDefault();

    setFeedbackStatus({ type: "", message: "" });
    setIsSendingFeedback(true);

    try {
      await sendFeedback(feedbackForm);
      setFeedbackForm({
        name: "",
        email: "",
        message: "",
        website: ""
      });
      setFeedbackStatus({
        type: "success",
        message: "Thanks for the feedback. Your message was sent to Watchli."
      });
    } catch (error) {
      setFeedbackStatus({
        type: "error",
        message: error.message || "Could not send feedback right now."
      });
    } finally {
      setIsSendingFeedback(false);
    }
  }

  return (
    <div className="homepage-shell min-h-screen text-slate-900">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-[#d2b08e]/34" />
      <div className="aurora-orb right-[-60px] top-36 h-72 w-72 bg-[#c49776]/28" />
      <div className="aurora-orb bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 bg-[#b5835a]/18" />

      <header className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:py-5">
        <BrandLogoLink to="/" size="hero" />

        <div className="hidden items-center gap-7 text-sm font-medium text-slate-700 md:flex">
          <a href="#how-it-works" className="transition hover:text-slate-950">
            How it works
          </a>
          <a href="#features" className="transition hover:text-slate-950">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-slate-950">
            Pricing
          </a>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <Link
            to="/login"
            className="homepage-button-secondary rounded-full px-4 py-2 text-center text-sm font-medium transition"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="glow-button rounded-full bg-gradient-to-r from-[#7b4d36] via-[#8d5b40] to-[#a06b49] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:scale-[1.02] hover:from-[#6e4531] hover:via-[#7f543d] hover:to-[#936345]"
          >
            Start Watching
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-18 pt-6 sm:px-6 sm:pb-24 sm:pt-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="homepage-chip mx-auto inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-700">
              <Sparkles className="h-4 w-4 text-[#8d5b40]" />
              <span>Product monitoring that feels calm, clear, and useful</span>
            </div>

            <h1 className="display-font mt-6 max-w-5xl text-4xl font-bold leading-[0.95] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Catch product price changes before you miss the moment.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
              Watchli tracks shopping pages, detects likely prices, and emails you when a product price rises, drops, or goes out of stock so you do not have to keep checking manually.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/signup"
                className="glow-button inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7b4d36] via-[#8d5b40] to-[#a06b49] px-6 py-3.5 font-semibold text-white transition hover:scale-[1.02] hover:from-[#6e4531] hover:via-[#7f543d] hover:to-[#936345]"
              >
                Start Watching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="homepage-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3.5 font-medium transition"
              >
                Log In
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-left sm:mt-9 sm:grid-cols-3">
              {heroMetrics.map((item) => (
                <div key={item.label} className="homepage-panel-soft rounded-3xl p-4 sm:p-5">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="display-font mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-[#8d5b40]">Product preview</p>
            <h2 className="display-font mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              See the monitoring dashboard before you sign up
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
              Watchli highlights tracked pages, recent alerts, and the latest status in one dashboard designed for product monitoring.
            </p>
          </div>

          <div className="relative">
            <div className="homepage-panel rounded-[28px] p-3 sm:rounded-[34px] sm:p-4">
              <div className="rounded-[24px] border border-[#3b312a]/10 bg-[linear-gradient(180deg,rgba(41,34,29,0.96),rgba(29,24,21,0.92))] p-4 sm:rounded-[28px] sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#dcc1a5]/80">
                      Live overview
                    </p>
                    <h2 className="display-font mt-2 text-xl font-bold text-white sm:text-2xl">
                      Monitoring dashboard
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#b5835a]/12 ring-1 ring-[#d5b08d]/18 sm:h-12 sm:w-12">
                    <BellRing className="h-5 w-5 text-[#f0dfcf]" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="glass-panel-soft rounded-3xl p-4 sm:p-5">
                    <div className="flex items-center justify-between text-sm text-stone-200">
                      <span>Tracked pages</span>
                      <span className="display-font text-lg font-semibold text-white">3</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dashboardPreview.map((item) => (
                        <div
                          key={item.url}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm text-stone-400">{item.label}</p>
                              <p className="break-all text-sm text-white sm:truncate">{item.url}</p>
                            </div>
                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                item.status === "Changed"
                                  ? "bg-[#c8a27b]/18 text-[#f4d9bf]"
                                  : "bg-[#8f9a7a]/18 text-[#edf1e4]"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="glass-panel-soft rounded-3xl p-5">
                      <p className="text-sm text-stone-400">Latest signal</p>
                      <p className="mt-3 display-font text-xl font-bold text-white sm:text-2xl">
                        Sneaker price updated
                      </p>
                      <p className="mt-3 text-sm leading-6 text-stone-300">
                        Watchli detected a likely price change on a watched product page and queued an alert.
                      </p>
                    </div>

                    <div className="glass-panel-soft rounded-3xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-[#b5835a]/12 p-3">
                          <Zap className="h-5 w-5 text-[#f0dfcf]" />
                        </div>
                        <div>
                          <p className="text-sm text-stone-400">How it works</p>
                          <p className="text-sm leading-6 text-white sm:text-base">
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
            <p className="text-sm uppercase tracking-[0.24em] text-[#8d5b40]">How it works</p>
            <h2 className="display-font mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Focus on product pages where price changes matter
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="homepage-panel rounded-[30px] p-5 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e0c2a7] to-[#d6b091] text-lg font-bold text-[#5c3b2a]">
                  {index + 1}
                </div>
                <h3 className="display-font mt-6 text-2xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="homepage-panel-soft rounded-[30px] p-5 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ead7c7] ring-1 ring-[#dcc0a6]">
                  <Icon className="h-5 w-5 text-[#7b4d36]" />
                </div>
                <h3 className="display-font mt-5 text-2xl font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#8d5b40]">Pricing preview</p>
              <h2 className="display-font mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Start with the free plan, grow into Pro
              </h2>
            </div>
            <p className="max-w-2xl text-slate-700">
              Watchli starts simple on purpose. The paid tier is ready when you want more watched product pages and a cleaner billing workflow.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`rounded-[32px] p-[1px] ${
                  index === 0
                    ? "bg-gradient-to-br from-[#d7b08d]/40 via-white/30 to-white/14"
                    : "bg-gradient-to-br from-[#b99674]/22 via-white/24 to-white/12"
                }`}
              >
                <div className="homepage-panel h-full rounded-[31px] p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        {plan.name}
                      </p>
                      <h3 className="display-font mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                        {plan.price}
                      </h3>
                      <p className="mt-3 max-w-md text-slate-700">{plan.description}</p>
                    </div>
                    {index === 0 ? (
                      <span className="rounded-full bg-[#ead7c7] px-3 py-1 text-xs font-semibold text-[#6b4430]">
                        Best for MVP
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#f1e3d2] px-3 py-1 text-xs font-semibold text-[#7b4d36]">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="rounded-2xl border border-[#d6c0ae]/50 bg-white/52 px-4 py-3 text-sm text-slate-700"
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
                          ? "homepage-button-secondary"
                          : "glow-button bg-gradient-to-r from-[#7b4d36] via-[#8d5b40] to-[#a06b49] text-white hover:scale-[1.01] hover:from-[#6e4531] hover:via-[#7f543d] hover:to-[#936345]"
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

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="grid gap-6 rounded-[32px] border border-[#d9c6b7] bg-white/82 p-6 shadow-[0_22px_60px_rgba(59,43,32,0.08)] backdrop-blur sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ead7c7] ring-1 ring-[#dcc0a6]">
                <MessageSquare className="h-5 w-5 text-[#7b4d36]" />
              </div>
              <p className="mt-5 text-sm uppercase tracking-[0.24em] text-[#8d5b40]">Send feedback</p>
              <h2 className="display-font mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Tell Watchli what you want improved
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
                Found a bug, want a feature, or have an idea that would make Watchli better?
                Send it here and it will go directly to the Watchli inbox.
              </p>
              <p className="mt-5 text-sm text-slate-600">
                You can also email{" "}
                <a className="font-semibold text-[#7b4d36] hover:text-slate-900" href="mailto:contactwatchli@gmail.com">
                  contactwatchli@gmail.com
                </a>
                .
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleFeedbackSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    type="text"
                    value={feedbackForm.name}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#dbc8ba] bg-[#fffdfb] px-4 py-3 text-[#6b4430] outline-none transition placeholder:text-[#b59681] focus:border-[#c98d64] focus:ring-4 focus:ring-[#ead7c7]"
                    placeholder="Your name"
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    value={feedbackForm.email}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-[#dbc8ba] bg-[#fffdfb] px-4 py-3 text-[#6b4430] outline-none transition placeholder:text-[#b59681] focus:border-[#c98d64] focus:ring-4 focus:ring-[#ead7c7]"
                    placeholder="you@example.com"
                    maxLength={180}
                  />
                </label>
              </div>

              <label className="hidden">
                <span>Website</span>
                <input
                  type="text"
                  tabIndex="-1"
                  autoComplete="off"
                  value={feedbackForm.website}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, website: event.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
                <textarea
                  required
                  rows={6}
                  value={feedbackForm.message}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, message: event.target.value }))
                  }
                  className="w-full rounded-3xl border border-[#dbc8ba] bg-[#fffdfb] px-4 py-3 text-[#6b4430] outline-none transition placeholder:text-[#b59681] focus:border-[#c98d64] focus:ring-4 focus:ring-[#ead7c7]"
                  placeholder="Share feedback, report a bug, or suggest a feature."
                  maxLength={2500}
                />
              </label>

              {feedbackStatus.message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feedbackStatus.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {feedbackStatus.message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="submit"
                  disabled={isSendingFeedback}
                  className="glow-button inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7b4d36] via-[#8d5b40] to-[#a06b49] px-6 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-[#6e4531] hover:via-[#7f543d] hover:to-[#936345] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingFeedback ? "Sending..." : "Send feedback"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooterDense />
    </div>
  );
}
