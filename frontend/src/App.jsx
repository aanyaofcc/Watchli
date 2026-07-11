import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./providers/AuthProvider";
import { AppLayoutPro } from "./components/AppLayoutPro";
import { LandingPagePro } from "./pages/LandingPagePro";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UpgradePage } from "./pages/UpgradePage";
import { PrivacyPolicyPage, TermsOfServicePage } from "./pages/LegalPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPagePro />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayoutPro>
              <DashboardPage />
            </AppLayoutPro>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upgrade"
        element={
          <ProtectedRoute>
            <AppLayoutPro>
              <UpgradePage />
            </AppLayoutPro>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
