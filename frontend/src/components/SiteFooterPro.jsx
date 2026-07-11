import { Link } from "react-router-dom";
import { Eye, Mail } from "lucide-react";

export function SiteFooterPro({ compact = false, width = "max-w-7xl" }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.62),rgba(2,6,23,0.92))]">
      <div className={`mx-auto ${width} px-6 ${compact ? "py-6" : "py-10"}`}>
        <div className="grid gap-8 md:grid-cols-[1.3fr_0.8fr_0.8fr] md:items-start">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <Eye className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <p className="display-font text-base font-bold text-white">Watchli</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Website watcher
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Track product pages, catch price changes, and receive alerts without
              refreshing tabs all day.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-400">
              Price tracking
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Support</p>
            <div className="mt-4 space-y-3">
              <a
                href="mailto:contactwatchli@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/15"
              >
                <Mail className="h-4 w-4" />
                contactwatchli@gmail.com
              </a>
              <p className="max-w-xs text-sm leading-6 text-slate-400">
                Questions about alerts, billing, or setup? Reach out and we will help.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Legal</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <Link to="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs tracking-[0.08em] text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Watchli. All rights reserved.</p>
          <p>Built for clean product monitoring and dependable email alerts.</p>
        </div>
      </div>
    </footer>
  );
}
