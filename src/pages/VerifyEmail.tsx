import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AUTH_CALLBACK_URL = `${window.location.origin}/auth/callback`;

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const openMail = () => {
    // Best-effort: try to open the user's webmail / mail app.
    const domain = email.split("@")[1]?.toLowerCase();
    const map: Record<string, string> = {
      "gmail.com": "https://mail.google.com",
      "googlemail.com": "https://mail.google.com",
      "outlook.com": "https://outlook.live.com/mail",
      "hotmail.com": "https://outlook.live.com/mail",
      "live.com": "https://outlook.live.com/mail",
      "yahoo.com": "https://mail.yahoo.com",
      "icloud.com": "https://www.icloud.com/mail",
      "me.com": "https://www.icloud.com/mail",
      "proton.me": "https://mail.proton.me",
      "protonmail.com": "https://mail.proton.me",
    };
    const url = (domain && map[domain]) || (email ? `mailto:${email}` : "mailto:");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resend = async () => {
    if (!email) {
      toast({ title: "Missing email", description: "Go back and try signing up again.", variant: "destructive" });
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: AUTH_CALLBACK_URL },
      });
      if (error) throw error;
      toast({ title: "Sent", description: "Check your inbox for the new link." });
    } catch (e: any) {
      toast({ title: "Couldn't send", description: e.message || "Try again in a minute.", variant: "destructive" });
    } finally { setResending(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 antialiased">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-neutral-500">
            We sent a confirmation link to{" "}
            <span className="font-medium text-neutral-900">{email || "your inbox"}</span>. Click it to finish setting up your Rocket account.
          </p>
          <Button onClick={openMail} size="lg" className="mt-6 w-full">Open email app</Button>
          <Button onClick={resend} disabled={resending} variant="outline" size="lg" className="mt-3 w-full">
            {resending ? "Sending…" : "Resend email"}
          </Button>
          <p className="mt-6 text-xs text-neutral-500">
            Wrong address? <Link to="/signup" className="font-medium text-neutral-900 hover:underline">Start over</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default VerifyEmail;