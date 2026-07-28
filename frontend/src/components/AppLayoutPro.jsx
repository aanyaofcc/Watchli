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

  const pathLabel =
    location.pathname === "/dashboard"
      ? "dashboard"
      : location.pathname === "/settings"
        ? "settings"
        : location.pathname === "/upgrade"
          ? "upgrade"
          : "app";

  return (
    <div className="tech-shell min-h-screen text-slate-100">
      <div className="aurora-orb left-[-140px] top-16 h-72 w-72 bg-[#f2e8dc]/12" />
      <div className="aurora-orb right-[-120px] top-24 h-80 w-80 bg-[#cfb89f]/10" />
      <header className="app-topbar">
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f26d7d]" />
                <span className="h-3 w-3 rounded-full bg-[#f2c94c]" />
                <span className="h-3 w-3 rounded-full bg-[#6fcf97]" />
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">
                watchliweb.com/{pathLabel}
              </div>
            </div>

            <BrandLogoLink to="/" size="dashboard" subtitle="Mission control" />

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
                        ? "border border-[#356dcf] bg-[#2c2725] text-white"
                        : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/80 px-4 py-2 text-sm font-medium text-white">
              Live product monitoring
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 transition hover:bg-white/[0.06]"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-workspace relative z-10">
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Watchli</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Mission control</h2>

            <nav className="mt-6 space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-lg transition ${
                      active
                        ? "border border-[#356dcf] bg-[#2c2725] text-white shadow-[inset_0_0_0_1px_rgba(53,109,207,0.1)]"
                        : "border border-transparent bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {children}
          </div>
        </div>
      </main>

      <SiteFooterDense compact width="max-w-[1760px]" />
    </div>
  );
}
