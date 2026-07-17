import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { BrandLogoLink } from "./BrandLogo";
import { SiteFooter } from "./SiteFooter";

export function AppLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="tech-shell min-h-screen text-slate-100">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-cyan-400/20" />
      <div className="aurora-orb right-[-80px] top-32 h-72 w-72 bg-blue-500/20" />
      <header className="relative z-10 border-b border-white/12 bg-[#2b3b4c]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogoLink to="/" size="dashboard" />
          <div className="flex items-center gap-3">
            <Link
              to="/upgrade"
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/15"
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/12"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="relative z-10 border-t border-white/12 bg-[#2b3b4c]/76">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 Watchli. Website monitoring for product and price changes. Contact:{" "}
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
    </div>
  );
}
