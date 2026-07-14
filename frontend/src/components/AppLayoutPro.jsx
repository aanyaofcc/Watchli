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
      <header className="relative z-10 border-b border-slate-200/12 bg-[#f4f7fb]/78 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3.5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <BrandLogoLink to="/" size="dashboard" />
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Link
              to="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <Link
              to="/upgrade"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#a8c0b2]/50 bg-[#dfe9e3] px-4 py-2 text-sm text-slate-700 transition hover:bg-[#e8f0eb]"
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <SiteFooterDense compact width="max-w-none" />
    </div>
  );
}
