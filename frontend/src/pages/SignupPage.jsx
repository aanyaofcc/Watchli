import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { trackEvent } from "../lib/analytics";
import { useAuth } from "../providers/AuthProvider";

export function SignupPage() {
  const { signup } = useAuth();
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
      await signup(formData.email, formData.password);
      trackEvent("sign_up", {
        method: "email_password"
      });
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tech-shell auth-shell flex min-h-screen items-center justify-center px-6 py-10">
      <div className="aurora-orb left-[-70px] top-16 h-72 w-72 bg-[#c79b74]/18" />
      <div className="aurora-orb right-[-60px] bottom-20 h-72 w-72 bg-[#8f6a4c]/18" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_0.7fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">Start watching</p>
            <h1 className="display-font mt-4 text-6xl font-bold leading-[0.95] text-white">
              Turn scattered tabs into a single signal feed.
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-300">
              Create your account and begin tracking the pages that matter to your
              workflow, your product research, or your team’s competitive awareness.
            </p>
          </div>
        </div>
        <AuthCard
          title="Create your account"
          subtitle="Start watching important webpages in a few minutes."
          submitLabel="Sign Up"
          footerText="Already have an account?"
          footerLabel="Log in"
          footerLink="/login"
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          error={error}
            loading={loading}
          />
        </div>
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-stone-400">
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
