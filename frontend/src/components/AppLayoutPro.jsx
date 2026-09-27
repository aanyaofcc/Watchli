import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, Crown, LayoutDashboard, LogOut, Settings } from "lucide-react";
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
      <div className="aurora-orb left-[-140px] top-16 h-72 w-72" style={{ background: "var(--app-orb-1)" }} />
      <div className="aurora-orb right-[-120px] top-24 h-80 w-80" style={{ background: "var(--app-orb-2)" }} />
      <header className="app-topbar">
        <div className="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogoLink to="/" size="dashboard" subtitle="Change intelligence" />

          <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto sm:order-none sm:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition ${
                    active ? "theme-active-nav" : "theme-outline-button text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="theme-accent-chip hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium md:inline-flex">
              <Activity className="h-4 w-4" />
              Monitoring active
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="theme-outline-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-workspace relative z-10">
        {children}
      </main>

      <SiteFooterDense compact width="max-w-[1480px]" />
    </div>
  );
}
