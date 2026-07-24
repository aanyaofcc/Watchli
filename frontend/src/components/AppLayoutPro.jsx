import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { BrandLogoLink } from "./BrandLogo";
import { SiteFooterDense } from "./SiteFooterDense";

export function AppLayoutPro({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      to: "/settings",
      label: "Settings",
      icon: Settings
    },
    {
      to: "/upgrade",
      label: "Upgrade",
      icon: Crown
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="tech-shell min-h-screen text-slate-100">
      <div className="aurora-orb left-[-140px] top-16 h-72 w-72 bg-[#f2e8dc]/12" />
      <div className="aurora-orb right-[-120px] top-24 h-80 w-80 bg-[#cfb89f]/10" />
      <header className="app-topbar">
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <BrandLogoLink to="/" size="dashboard" subtitle="App workspace" />
            <nav className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                      active
                        ? "border border-[#f3e8db]/16 bg-[#f3e8db]/10 text-white"
                        : "border border-white/8 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="uppercase tracking-[0.18em]">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-100 transition hover:bg-white/[0.05]"
            >
              <LogOut className="h-4 w-4" />
              <span className="uppercase tracking-[0.18em]">Log Out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="app-workspace relative z-10">{children}</main>
      <SiteFooterDense compact width="max-w-none" />
    </div>
  );
}
