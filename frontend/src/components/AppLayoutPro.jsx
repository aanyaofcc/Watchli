import { Link, useNavigate } from "react-router-dom";
import { Crown, LogOut, Settings } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { BrandLogoLink } from "./BrandLogo";
import { SiteFooterDense } from "./SiteFooterDense";

export function AppLayoutPro({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="tech-shell min-h-screen text-slate-100">
      <div className="aurora-orb left-[-80px] top-20 h-64 w-64 bg-emerald-200/20" />
      <div className="aurora-orb right-[-80px] top-32 h-72 w-72 bg-slate-200/10" />
      <header className="relative z-10 border-b border-white/6 bg-[#111923]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <BrandLogoLink to="/" size="dashboard" />
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Link
              to="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#a8c0b2]/20 bg-[#a8c0b2]/10 px-4 py-2 text-sm text-[#d9e8df] transition hover:bg-[#a8c0b2]/14"
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <SiteFooterDense compact width="max-w-5xl" />
    </div>
  );
}
