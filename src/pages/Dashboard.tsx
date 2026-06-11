import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
const supabase = _sb as any;
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Plus, ExternalLink } from "lucide-react";
import ProjectSidebar from "@/components/ProjectSidebar";

const Dashboard = () => {
  const { user } = useAuth();
  const [rockets, setRockets] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [r, u, s] = await Promise.all([
        supabase.from("rockets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("user_usage").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setRockets(r.data || []);
      setUsage(u.data);
      setSub(s.data);
    })();
  }, [user]);

  const total = usage ? usage.monthly_limit + (usage.credits_extra || 0) : 0;
  const used = usage?.credits_used || 0;
  const pct = total ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full">
      <ProjectSidebar />
      <main className="flex-1 overflow-auto bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Welcome back{user?.email ? `, ${user.email}` : ""}.</p>
        </div>
        <Link to="/create" className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> New Asset
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Assets</div>
          <div className="mt-2 text-3xl font-semibold">{rockets.length}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Plan</div>
          <div className="mt-2 text-3xl font-semibold capitalize">{usage?.plan || "Free"}</div>
          <div className="mt-1 text-xs text-neutral-500">{sub?.status === "trialing" ? "On free trial" : sub?.status || ""}</div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Credits</div>
            <div className="text-xs text-neutral-500">{used.toLocaleString()} / {total.toLocaleString()}</div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
          <Link to="/settings/billing" className="mt-3 inline-block text-xs font-medium text-neutral-700 hover:underline">Manage billing →</Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Assets</h2>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rockets.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-neutral-500">No assets yet. Start by creating a logo, tagline, positioning strategy, launch plan, or social campaign.</p>
              <Link to="/create" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand-hover">Create your first asset <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {rockets.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-neutral-50">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.product_name || r.product_url}</div>
                    <div className="truncate text-xs text-neutral-500">{r.product_url}</div>
                  </div>
                  <Link to={`/rocket/${r.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline">Open <ArrowRight className="h-3.5 w-3.5" /></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="mt-10 flex items-center justify-between rounded-2xl border border-neutral-900 bg-neutral-900 p-5 text-white transition hover:bg-neutral-800">
        <div>
          <div className="text-sm font-semibold">Ready to go live?</div>
          <div className="text-xs text-neutral-300">Launch on Launch</div>
        </div>
        <ExternalLink className="h-4 w-4" />
      </a>
      </div>
      </main>
    </div>
  );
};

export default Dashboard;