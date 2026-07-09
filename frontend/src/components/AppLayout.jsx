import { Link, useNavigate } from "react-router-dom";
import { Crown, Eye, LogOut } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";

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
      <header className="relative z-10 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
              <Eye className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="display-font text-lg font-bold text-white">Watchli</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Dashboard</p>
            </div>
          </Link>
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
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
