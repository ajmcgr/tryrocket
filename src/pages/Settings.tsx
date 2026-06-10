import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Plug } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const supabase = _sb as any;

const TABS = [
  { to: "/settings/profile", label: "Profile" },
  { to: "/settings/integrations", label: "Integrations" },
  { to: "/settings/notifications", label: "Notifications" },
  { to: "/settings/account", label: "Account" },
  { to: "/settings/billing", label: "Billing" },
];

const PACKS = [
  { id: "pack_500", credits: 500, price: "$5" },
  { id: "pack_1500", credits: 1500, price: "$10" },
  { id: "pack_5000", credits: 5000, price: "$25" },
];

export const SettingsLayout = () => {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <div className="mt-6 inline-flex rounded-xl border border-neutral-200 bg-white p-1">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any)?.user_metadata?.avatar_url || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [username, setUsername] = useState<string>((user as any)?.user_metadata?.username || "");

  const saveProfile = async () => {
    setLoading("profile");
    try {
      const u = username.trim().replace(/^@/, "");
      if (u && !/^[a-zA-Z0-9_]{2,30}$/.test(u)) {
        toast({ title: "Invalid username", description: "2–30 letters, numbers, or underscores.", variant: "destructive" });
        setLoading(null);
        return;
      }
      const payload: any = { data: { avatar_url: avatarUrl, username: u } };
      if (newPassword) payload.password = newPassword;
      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;
      await supabase.auth.refreshSession();
      toast({ title: "Profile saved" });
      setNewPassword("");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setLoading(null); }
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file", description: "Use JPEG, PNG, or WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const ext = extMap[file.type] || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        console.error("[avatar upload] supabase error:", upErr);
        throw upErr;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      setAvatarUrl(url);
      const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (updErr) {
        console.error("[avatar updateUser] supabase error:", updErr);
        throw updErr;
      }
      await supabase.auth.refreshSession();
      toast({ title: "Avatar updated" });
    } catch (e: any) {
      console.error("[avatar upload] failed:", e);
      toast({ title: "Upload failed", description: e?.message || String(e), variant: "destructive" });
    } finally { setUploadingAvatar(false); }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-neutral-500">{user?.email}</p>
      <div className="mt-5 flex items-center gap-4">
        <Avatar className="h-14 w-14 border border-neutral-200">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="bg-neutral-100 text-sm text-neutral-700">{(user?.email?.[0] || "U").toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ""; }}
            />
          </label>
          {avatarUrl && (
            <button
              type="button"
              onClick={async () => {
                setAvatarUrl("");
                try {
                  await supabase.auth.updateUser({ data: { avatar_url: "" } });
                  await supabase.auth.refreshSession();
                } catch (e: any) {
                  toast({ title: "Couldn't remove", description: e?.message || String(e), variant: "destructive" });
                }
              }}
              className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">
        <label className="text-xs font-medium text-neutral-600">Username</label>
        <div className="mt-1 flex items-center rounded-lg border border-neutral-200 bg-white pl-3 ring-neutral-300 focus-within:ring-2">
          <span className="text-sm text-neutral-400">@</span>
          <input
            type="text"
            maxLength={30}
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-10 flex-1 rounded-r-lg bg-transparent px-2 text-sm outline-none"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="text-xs font-medium text-neutral-600">New password</label>
        <input
          type="password"
          placeholder="Leave blank to keep current"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none ring-neutral-300 focus:ring-2"
        />
      </div>
      <button onClick={saveProfile} disabled={loading === "profile"} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
        {loading === "profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
      </button>
    </section>
  );
};

export const IntegrationsSettings = () => {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold">Integrations</h2>
      <p className="mt-1 text-sm text-neutral-600">Connect Rocket to the tools you already use.</p>
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 py-12 text-center">
        <Plug className="h-6 w-6 text-neutral-400" />
        <p className="mt-3 text-sm font-medium text-neutral-700">No integrations yet</p>
        <p className="mt-1 text-xs text-neutral-500">We're building integrations with Figma, Notion, and Slack. Check back soon.</p>
      </div>
    </section>
  );
};

export const NotificationsSettings = () => {
  const [emailsEnabled, setEmailsEnabled] = useState<boolean>(() => localStorage.getItem("notif_emails") !== "0");
  const toggleEmails = (v: boolean) => {
    setEmailsEnabled(v);
    localStorage.setItem("notif_emails", v ? "1" : "0");
  };
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold">Notifications</h2>
      <label className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm text-neutral-700">Product & launch emails</span>
        <button
          onClick={() => toggleEmails(!emailsEnabled)}
          className={`relative h-6 w-11 rounded-full transition ${emailsEnabled ? "bg-brand" : "bg-neutral-300"}`}
          aria-pressed={emailsEnabled}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${emailsEnabled ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </label>
    </section>
  );
};

export const AccountSettings = () => {
  const { toast } = useToast();
  const nav = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const deleteAccount = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    setLoading("delete");
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut();
      nav("/");
    } catch (e: any) {
      toast({ title: "Couldn't delete", description: e.message + " — contact support@tryrocket.ai", variant: "destructive" });
    } finally { setLoading(null); }
  };

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-6">
      <h2 className="text-base font-semibold text-red-700">Delete account</h2>
      <p className="mt-1 text-sm text-neutral-600">Permanently delete your account and all data. This cannot be undone.</p>
      <button onClick={deleteAccount} disabled={loading === "delete"} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
        {loading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete account"}
      </button>
    </section>
  );
};

export const BillingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => setSub(data));
    supabase.from("user_usage").select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => setUsage(data));
  }, [user]);

  const checkout = async (product: string) => {
    setLoading(product);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", { body: { product } });
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally { setLoading(null); }
  };

  const portal = async () => {
    setLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw error;
      if ((data as any)?.url) window.location.href = (data as any).url;
    } catch (e: any) {
      toast({ title: "Portal failed", description: e.message, variant: "destructive" });
    } finally { setLoading(null); }
  };

  const remaining = usage ? usage.monthly_limit + (usage.credits_extra || 0) - usage.credits_used : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Billing</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Plan: <span className="font-medium capitalize">{usage?.plan || "free"}</span> · {remaining.toLocaleString()} credits remaining
            </p>
            {sub?.status && <p className="mt-0.5 text-xs text-neutral-500">Status: {sub.status}{sub.cancel_at_period_end ? " (canceling)" : ""}</p>}
          </div>
          {usage?.plan === "growth" ? (
            <button onClick={portal} disabled={loading === "portal"} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">
              {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}
            </button>
          ) : (
            <button onClick={() => checkout("growth")} disabled={loading === "growth"} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              {loading === "growth" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade — $20/mo"}
            </button>
          )}
        </div>

        {usage?.plan !== "growth" && (
          <ul className="mt-5 space-y-1.5 text-sm text-neutral-700">
            {["7-day free trial", "3,000 credits / month", "Unlimited saved Brand Assets", "Export tools", "Priority generation"].map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-neutral-900" /> {f}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold">Credit packs</h2>
        <p className="mt-1 text-sm text-neutral-600">One-time top ups. Credits never expire.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <button key={p.id} onClick={() => checkout(p.id)} disabled={loading === p.id} className="rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-900">
              <div className="text-base font-semibold">{p.credits.toLocaleString()} Credits</div>
              <div className="mt-1 text-lg font-semibold">{p.price}</div>
              <div className="mt-2 text-xs font-medium text-neutral-500">{loading === p.id ? "Loading…" : "Buy →"}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsLayout;