import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"verifying" | "success" | "error">(token ? "verifying" : "error");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const resend = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification");
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed");
      if (data?.already_verified) {
        toast({ title: "Already verified", description: "Your email is already confirmed — you're good to go." });
      } else if (data?.throttled) {
        toast({ title: "Too many requests", description: "You've requested several links recently. Please wait up to an hour and try again.", variant: "destructive" });
      } else {
        toast({ title: "Sent", description: "Check your inbox for the verification link." });
      }
    } catch (e: any) {
      toast({ title: "Couldn't send", description: e.message || "Make sure you're logged in.", variant: "destructive" });
    } finally { setResending(false); }
  };

  useEffect(() => {
    if (!token) { setMessage("This link is missing its verification token."); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("send-verification", { body: { action: "verify", token } });
        if (cancelled) return;
        if (error || data?.error) {
          let detail = data?.error || "";
          if (!detail && error && (error as any).context) {
            try { const body = await (error as any).context.json(); detail = body?.error || ""; } catch { /* ignore */ }
          }
          setState("error");
          setMessage(detail || "This link is invalid or has expired.");
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
              <Button onClick={resend} disabled={resending} size="lg" className="mt-6 w-full">{resending ? "Sending…" : "Resend verification email"}</Button>
              <Button asChild variant="outline" size="lg" className="mt-3 w-full"><Link to="/login">Back to login</Link></Button>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default VerifyEmail;