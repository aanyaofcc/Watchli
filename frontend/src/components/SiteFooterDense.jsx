import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import { BrandLogoLink } from "./BrandLogo";

export function SiteFooterDense({ compact = false, width = "max-w-7xl" }) {
  return (
    <footer className="relative z-10 border-t border-slate-700/40 bg-[linear-gradient(180deg,rgba(18,32,51,0.97),rgba(8,18,32,0.99))]">
      <div className={`mx-auto ${width} px-4 sm:px-6 ${compact ? "py-5" : "py-8"}`}>
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.8fr_0.8fr] md:items-start">
          <div className="max-w-md">
            <BrandLogoLink to="/" size="footer" />
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Track product pages, catch price changes, and receive alerts without
              refreshing tabs all day.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[0.07] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300">
              Change monitoring
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Support</p>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="mailto:contactwatchli@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[0.08] px-4 py-2 text-sm text-sky-50 transition hover:bg-sky-300/[0.14]"
                >
                  <Mail className="h-4 w-4" />
                  contactwatchli@gmail.com
                </a>
                <a
                  href="https://www.instagram.com/watchliweb/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Watchli Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/15 bg-white/[0.06] text-sky-50 transition hover:bg-white/[0.12]"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
              <p className="max-w-xs text-sm leading-6 text-stone-300">
                Questions about alerts, billing, or setup? Reach out and we will help.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Legal</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-stone-200">
              <Link to="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-700/50 pt-4 text-xs tracking-[0.08em] text-stone-400 md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 Watchli. All rights reserved.</p>
          <p>Built for clean product monitoring and dependable email alerts.</p>
        </div>
      </div>
    </footer>
  );
}
