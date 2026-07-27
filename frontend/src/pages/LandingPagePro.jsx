import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Crown,
  Eye,
  Globe,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { BrandLogoLink } from "../components/BrandLogo";
import { sendFeedback } from "../lib/api";

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
    body: "If the price or availability changes, you get an email instead of checking manually."
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
    features: ["3 product pages", "Email alerts", "Daily checks"]
  },
  {
    name: "Pro",
    price: "$7/mo",
    description: "For heavier price monitoring with more tracked items and the first paid Watchli tier.",
    features: ["100 product pages", "Billing portal", "Premium roadmap access"]
  }
];

const dashboardPreview = [
  {
    label: "Nike Total 90",
    url: "nike.com/t/total-90-womens-shoes",
    status: "Price dropped",
    price: "$125.00",
    change: "-$14.00"
  },
  {
    label: "Dyson Airwrap",
    url: "dyson.com/products/airwrap",
    status: "Watching",
    price: "$599.99",
    change: "Stable"
  },
  {
    label: "Sony WH-1000XM6",
    url: "store.com/products/sony-wh1000xm6",
    status: "Back in stock",
    price: "$429.99",
    change: "Inventory"
  }
];

const commandCenterStats = [
  { label: "Active watches", value: "24" },
  { label: "Price drops found", value: "9" },
  { label: "Alerts delivered", value: "18" }
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
    <div className="relative min-h-screen overflow-hidden bg-[#06111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_24%),linear-gradient(180deg,#06111f_0%,#081523_44%,#07111d_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-sky-400/22" />
      <div className="aurora-orb right-[-60px] top-36 h-72 w-72 bg-blue-400/20" />
      <div className="aurora-orb bottom-24 left-1/2 h-56 w-56 -translate-x-1/2 bg-cyan-300/16" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogoLink to="/" size="hero" />

        <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#product-preview" className="transition hover:text-white">
            Product preview
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="glow-button rounded-full bg-gradient-to-r from-[#29a4ff] via-[#2f7cf6] to-[#40c9ff] px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:from-[#1d96f3] hover:via-[#276fe4] hover:to-[#34bceb]"
          >
            Start Watching
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pt-2">
          <div className="flex flex-col gap-3 rounded-[28px] border border-cyan-300/12 bg-white/[0.04] px-5 py-4 text-sm text-slate-200 shadow-[0_18px_40px_rgba(5,12,24,0.35)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="display-font text-base font-semibold text-white">
                  Watchli tracks product pages for price drops, increases, sellouts, and listing changes.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Add a shopping URL, let Watchli monitor the page, and get emailed when something important changes.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="rounded-full border border-cyan-300/15 bg-white/[0.06] px-3 py-2">
                Product monitoring
              </span>
              <span className="rounded-full border border-cyan-300/15 bg-white/[0.06] px-3 py-2">
                Email alerts
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-12 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              High-signal monitoring for shopping pages
            </div>

            <h1 className="display-font mt-8 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A clean command center for price moves and page changes.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Watchli monitors shopping and product pages, looks for likely prices, and
              tells you when the listing changes so you can catch drops, increases, sellouts, or edits without manually checking all day.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Price-aware detection", "See likely current prices and movement fast."],
                ["Availability alerts", "Spot sold-out and back-in-stock changes sooner."],
                ["Snapshot history", "Keep before-and-after checks in one place."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="glow-button inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#29a4ff] via-[#2f7cf6] to-[#40c9ff] px-6 py-3.5 font-semibold text-white transition hover:scale-[1.02] hover:from-[#1d96f3] hover:via-[#276fe4] hover:to-[#34bceb]"
              >
                Start Watching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3.5 font-medium text-white transition hover:bg-white/10"
              >
                Log In
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "3 free watched pages",
                "Email alerts on real changes",
                "Built for product tracking",
                "Manual checks anytime"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div id="product-preview" className="relative">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[40px] bg-cyan-400/10 blur-3xl" />
            <div className="relative rounded-[38px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3 shadow-[0_30px_90px_rgba(1,8,20,0.6)] backdrop-blur-xl">
              <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#08121f_0%,#091827_56%,#07111c_100%)] p-5">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                      watchliweb.com/dashboard
                    </div>
                  </div>
                  <div className="rounded-full border border-cyan-300/18 bg-cyan-300/8 px-3 py-1 text-xs font-medium text-cyan-100">
                    Live product monitoring
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Watchli
                    </p>
                    <h2 className="mt-3 display-font text-2xl font-bold text-white">
                      Mission control
                    </h2>
                    <div className="mt-5 space-y-2 text-sm text-slate-300">
                      {[
                        "Dashboard",
                        "Watched pages",
                        "History",
                        "Notifications",
                        "Billing"
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-2xl px-3 py-2 ${
                            index === 0
                              ? "bg-cyan-300/10 text-white ring-1 ring-cyan-300/20"
                              : "bg-white/[0.03]"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
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

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {commandCenterStats.map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                            >
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                {stat.label}
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-white">
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 space-y-3">
                          {dashboardPreview.map((item) => (
                            <div
                              key={item.url}
                              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="text-sm text-slate-300">{item.label}</p>
                                  <p className="truncate text-sm text-white">{item.url}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-white">{item.price}</p>
                                  <p
                                    className={`text-xs ${
                                      item.change.startsWith("-")
                                        ? "text-emerald-300"
                                        : item.change === "Stable"
                                          ? "text-slate-300"
                                          : "text-cyan-200"
                                    }`}
                                  >
                                    {item.change}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    item.status === "Price dropped"
                                      ? "bg-emerald-400/15 text-emerald-200"
                                      : item.status === "Back in stock"
                                        ? "bg-cyan-400/15 text-cyan-200"
                                        : "bg-slate-300/10 text-slate-200"
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
                        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                          <p className="text-sm text-slate-300">Latest alert pulse</p>
                          <p className="mt-3 display-font text-2xl font-bold text-white">
                            Nike price dropped
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-300">
                            Watchli detected a real movement and queued an email with the before-and-after price.
                          </p>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-cyan-300/10 p-3">
                              <LineChart className="h-5 w-5 text-cyan-200" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-300">Signal quality</p>
                              <p className="text-white">Price + stock + change confidence</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-cyan-300/10 p-3">
                              <ScanSearch className="h-5 w-5 text-cyan-200" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-300">Snapshot history</p>
                              <p className="text-white">Readable diffs and alert trails</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Built for real product pages",
                body: "Track the pages people actually watch: shoes, electronics, beauty, home, and limited drops."
              },
              {
                icon: CheckCircle2,
                title: "Alerts with context",
                body: "Emails focus on actual price increases, decreases, sellouts, and availability changes."
              },
              {
                icon: BellRing,
                title: "A dashboard you can scan",
                body: "Latest price, watch state, history, and alert activity stay visible in one workflow."
              }
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 text-white shadow-[0_18px_50px_rgba(3,10,20,0.35)] backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/20">
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

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">How it works</p>
            <h2 className="display-font mt-3 text-4xl font-bold text-white">
              Watchli turns noisy product pages into simple signals
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-400 text-lg font-bold text-slate-950">
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

        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-6 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/20">
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

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 pb-24">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Pricing preview</p>
              <h2 className="display-font mt-3 text-4xl font-bold text-white">
                Start simple now, scale when you need more coverage
              </h2>
            </div>
            <p className="max-w-2xl text-slate-300">
              The MVP stays simple, but the structure is ready for more tracked products,
              faster checks, and Stripe billing when you want to grow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`rounded-[32px] border p-8 backdrop-blur-xl ${
                  index === 0
                    ? "border-cyan-300/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))]"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                      {plan.name}
                    </p>
                    <h3 className="display-font mt-3 text-4xl font-bold text-white">
                      {plan.price}
                    </h3>
                    <p className="mt-3 max-w-md text-slate-300">{plan.description}</p>
                  </div>
                  {index === 0 ? (
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-300/20">
                      Best for MVP
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/20">
                      New
                    </span>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-200"
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
                        ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        : "glow-button bg-gradient-to-r from-[#29a4ff] via-[#2f7cf6] to-[#40c9ff] text-white hover:scale-[1.01] hover:from-[#1d96f3] hover:via-[#276fe4] hover:to-[#34bceb]"
                    }`}
                  >
                    {index === 0 ? "Start Free" : "See Pro"}
                    {index === 1 ? <Crown className="h-4 w-4" /> : null}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-8 rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 ring-1 ring-cyan-300/20">
                <MessageSquare className="h-5 w-5 text-cyan-200" />
              </div>
              <p className="mt-5 text-sm uppercase tracking-[0.24em] text-cyan-200">Send feedback</p>
              <h2 className="display-font mt-3 text-4xl font-bold text-white">
                Tell Watchli what you want improved
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Found a bug, want a feature, or have an idea that would make Watchli more useful?
                Send it here and it will go directly to the Watchli inbox.
              </p>
              <p className="mt-5 text-sm text-slate-400">
                You can also email{" "}
                <a className="font-semibold text-cyan-200 hover:text-white" href="mailto:contactwatchli@gmail.com">
                  contactwatchli@gmail.com
                </a>
                .
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleFeedbackSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Name</span>
                  <input
                    type="text"
                    value={feedbackForm.name}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                    placeholder="Your name"
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                  <input
                    type="email"
                    required
                    value={feedbackForm.email}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
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
                <span className="mb-2 block text-sm font-medium text-slate-300">Message</span>
                <textarea
                  required
                  rows={6}
                  value={feedbackForm.message}
                  onChange={(event) =>
                    setFeedbackForm((current) => ({ ...current, message: event.target.value }))
                  }
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Share feedback, report a bug, or suggest a feature."
                  maxLength={2500}
                />
              </label>

              {feedbackStatus.message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feedbackStatus.type === "success"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : "border-rose-400/20 bg-rose-500/10 text-rose-100"
                  }`}
                >
                  {feedbackStatus.message}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="submit"
                  disabled={isSendingFeedback}
                  className="glow-button inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#29a4ff] via-[#2f7cf6] to-[#40c9ff] px-6 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-[#1d96f3] hover:via-[#276fe4] hover:to-[#34bceb] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingFeedback ? "Sending..." : "Send feedback"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <footer className="mx-auto max-w-7xl border-t border-white/10 px-6 py-8 text-sm text-slate-400">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 Watchli. Monitor product pages and get alerts when they change. Contact:{" "}
              <a className="text-cyan-200 hover:text-white" href="mailto:contactwatchli@gmail.com">
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
