import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"verifying" | "success" | "error">(token ? "verifying" : "error");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setMessage("This link is missing its verification token."); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-email", { body: { token } });
        if (cancelled) return;
        if (error || data?.error) {
          setState("error");
          setMessage(data?.error || "This link is invalid or has expired.");
        } else {
          setState("success");
        }
      } catch {
        if (!cancelled) { setState("error"); setMessage("Something went wrong. Please try again."); }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          {state === "verifying" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Verifying your email…</h1>
              <p className="mt-2 text-sm text-neutral-500">One moment.</p>
            </>
          )}
          {state === "success" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Email verified 🎉</h1>
              <p className="mt-2 text-sm text-neutral-500">You're all set. Time to launch.</p>
              <Button asChild size="lg" className="mt-6 w-full"><Link to="/create">Go to Rocket</Link></Button>
            </>
          )}
          {state === "error" && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Verification failed</h1>
              <p className="mt-2 text-sm text-neutral-500">{message}</p>
              <Button asChild variant="outline" size="lg" className="mt-6 w-full"><Link to="/login">Back to login</Link></Button>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default VerifyEmail;