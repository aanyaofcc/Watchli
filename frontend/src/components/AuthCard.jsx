import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

export function AuthCard({
  title,
  subtitle,
  submitLabel,
  footerLabel,
  footerLink,
  footerText,
  formData,
  onChange,
  onSubmit,
  error,
  loading,
  success,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="glass-panel mx-auto w-full max-w-md rounded-[30px] p-8">
      <div className="mb-8">
        <div className="data-chip inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
          Secure access
        </div>
        <h1 className="display-font mt-4 text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-200">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={onChange}
              required
              minLength={6}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              placeholder="Minimum 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        {secondaryActionLabel && onSecondaryAction ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={secondaryActionDisabled}
              className="text-sm text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {secondaryActionLabel}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="glow-button w-full rounded-2xl border border-[#9ebdd6]/24 bg-gradient-to-r from-[#35506b] via-[#3f6385] to-[#4d7596] px-4 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-[#2f485f] hover:via-[#395a78] hover:to-[#456b8c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait..." : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-300">
        {footerText}{" "}
        <Link to={footerLink} className="text-cyan-300 transition hover:text-cyan-200">
          {footerLabel}
        </Link>
      </p>
    </div>
  );
}
