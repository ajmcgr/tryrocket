import { useEffect } from "react";
import Login from "./Login";
import { supabase } from "@/integrations/supabase/client";

const Signup = () => {
  useEffect(() => {
    // Fire welcome email when a confirmed session lands on signup completion
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        const flagKey = `welcome_sent_${session.user.id}`;
        if (!localStorage.getItem(flagKey)) {
          try {
            await supabase.functions.invoke("send-email", {
              body: { template: "welcome", data: { name: session.user.email?.split("@")[0] } },
            });
            localStorage.setItem(flagKey, "1");
          } catch (_e) { /* swallow */ }
        }
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  return <Login mode="signup" />;
};
export default Signup;