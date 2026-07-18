import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { BrandLogoLink } from "./BrandLogo";

export function SiteFooterDense({ compact = false, width = "max-w-7xl" }) {
  return (
    <footer className="relative z-10 border-t border-[#d3b697]/16 bg-[linear-gradient(180deg,rgba(43,36,31,0.92),rgba(26,22,19,0.98))]">
      <div className={`mx-auto ${width} px-4 sm:px-6 ${compact ? "py-5" : "py-8"}`}>
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.8fr_0.8fr] md:items-start">
          <div className="max-w-md">
            <BrandLogoLink to="/" size="footer" />
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Track product pages, catch price changes, and receive alerts without
              refreshing tabs all day.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d3b697]/18 bg-white/[0.06] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-stone-300">
              Price tracking
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Support</p>
            <div className="mt-4 space-y-3">
              <a
                href="mailto:contactwatchli@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-[#c9a37f]/18 bg-[#8d5b40]/22 px-4 py-2 text-sm text-amber-50 transition hover:bg-[#8d5b40]/32"
              >
                <Mail className="h-4 w-4" />
                contactwatchli@gmail.com
              </a>
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

        <div className="mt-6 flex flex-col gap-3 border-t border-[#d3b697]/14 pt-4 text-xs tracking-[0.08em] text-stone-400 md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 Watchli. All rights reserved.</p>
          <p>Built for clean product monitoring and dependable email alerts.</p>
        </div>
      </div>
    </footer>
  );
}
