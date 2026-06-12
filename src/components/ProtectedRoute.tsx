import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const provider = (user?.app_metadata as { provider?: string } | undefined)?.provider || "email";
  const isOAuth = provider !== "email";

  const [verified, setVerified] = useState<boolean | null>(isOAuth ? true : null);

  useEffect(() => {
    if (!user || isOAuth) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            eq: (k: string, v: string) => {
              maybeSingle: () => Promise<{ data: { email_verified?: boolean } | null }>;
            };
          };
        };
      }).from("profiles").select("email_verified").eq("user_id", user.id).maybeSingle();
      if (!cancelled) setVerified(!!data?.email_verified);
    })();
    return () => { cancelled = true; };
  }, [user, isOAuth]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-sm text-neutral-500">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (verified === null) return <div className="grid min-h-screen place-items-center bg-white text-sm text-neutral-500">Loading…</div>;
  if (!verified) return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || "")}`} replace />;
  return <>{children}</>;
};

export default ProtectedRoute;