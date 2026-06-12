import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-sm text-neutral-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;

  const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;
  const isOAuth = provider && provider !== "email";
  const confirmed = !!(user.email_confirmed_at || (user as { confirmed_at?: string }).confirmed_at);
  if (!isOAuth && !confirmed) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;