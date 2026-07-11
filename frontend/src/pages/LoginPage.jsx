import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { useAuth } from "../providers/AuthProvider";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tech-shell flex min-h-screen items-center justify-center px-6 py-10">
      <div className="aurora-orb left-[-90px] top-20 h-72 w-72 bg-cyan-400/20" />
      <div className="aurora-orb right-[-80px] bottom-24 h-72 w-72 bg-blue-500/20" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.7fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Back in the loop</p>
            <h1 className="display-font mt-4 text-6xl font-bold leading-[0.95] text-white">
              Your monitoring cockpit is ready.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Check snapshots, run manual tests, and keep your tracked pages organized
              from one clean command surface.
            </p>
          </div>
        </div>
        <AuthCard
          title="Welcome back"
          subtitle="Log in to manage the websites you're tracking."
          submitLabel="Log In"
          footerText="Need an account?"
          footerLabel="Sign up"
          footerLink="/signup"
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          error={error}
            loading={loading}
          />
        </div>
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-400">
          <Link to="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link to="/terms" className="transition hover:text-white">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
