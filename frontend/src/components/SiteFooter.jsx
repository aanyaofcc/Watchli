import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { BrandLogoLink } from "./BrandLogo";

export function SiteFooter({ compact = false, width = "max-w-7xl" }) {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-slate-950/35">
      <div className={`mx-auto ${width} px-6 ${compact ? "py-6" : "py-10"}`}>
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
          <div className="max-w-md">
            <BrandLogoLink to="/" size="footer" />
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Track product pages, catch price changes, and receive alerts without
              refreshing tabs all day.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Support</p>
            <div className="mt-4">
              <a
                href="mailto:contactwatchli@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/15"
              >
                <Mail className="h-4 w-4" />
                contactwatchli@gmail.com
              </a>
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

        <div className="mt-8 border-t border-white/10 pt-5 text-xs tracking-[0.08em] text-slate-500">
          © 2026 Watchli. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
