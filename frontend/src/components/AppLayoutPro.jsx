import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { BrandLogoLink } from "./BrandLogo";

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
      <main className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-[34px] border border-[#e9dfd5]/85 bg-[#f3ece3] p-3 shadow-[0_26px_60px_rgba(42,32,24,0.18)] sm:p-5">
          <div className="rounded-[30px] border border-[#5f5348]/18 bg-[linear-gradient(180deg,#3b332d_0%,#342d28_100%)] p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/12 pb-4 sm:flex-row sm:items-center sm:justify-between">
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

              <div className="rounded-full border border-white/80 px-4 py-2 text-sm font-medium text-white">
                Live product monitoring
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5">
                <BrandLogoLink to="/" size="dashboard" subtitle="Mission control" />

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

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-8 flex w-full items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-slate-300 transition hover:bg-white/[0.06]"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Log out</span>
                </button>
              </aside>

              <div className="min-w-0">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
