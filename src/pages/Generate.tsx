import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowUp, Loader2, Sparkles, Wand2, Image as ImageIcon, Type, Palette, Megaphone, Rocket as RocketIcon, Wand, Paintbrush, Send, Radio } from "lucide-react";
import OutOfCreditsModal from "@/components/OutOfCreditsModal";
const supabase = _sb as any;

const ASSET_CHIPS: { id: string; label: string; Icon: any; example: string }[] = [
  { id: "logo", label: "Logo", Icon: Sparkles, example: "A logo for TryLaunch — clean SaaS, blue accent" },
  { id: "color_system", label: "Colors", Icon: Palette, example: "Color system for a developer-tools brand" },
  { id: "font_system", label: "Fonts", Icon: Type, example: "Font pairing for a modern fintech brand" },
  { id: "brand_voice", label: "Brand Voice", Icon: Wand2, example: "Brand voice for a friendly indie dev tool" },
  { id: "launch_copy", label: "Launch Copy", Icon: RocketIcon, example: "Landing page launch copy for trylaunch.ai" },
  { id: "product_hunt_copy", label: "PH Copy", Icon: RocketIcon, example: "Product Hunt copy for trylaunch.ai" },
  { id: "social_post", label: "Social Post", Icon: Megaphone, example: "X thread announcing trylaunch.ai launch" },
  { id: "graphic", label: "Graphic", Icon: ImageIcon, example: "Hero banner for a Mac productivity app" },
];

type WF = "auto" | "brand" | "design" | "launch" | "promote";
const WORKFLOWS: { id: WF; label: string; Icon: any; hint: string }[] = [
  { id: "auto", label: "Auto-detect", Icon: Wand, hint: "Rocket picks the specialist (1 asset)" },
  { id: "brand", label: "Brand It", Icon: Sparkles, hint: "Logo + colors + fonts + voice" },
  { id: "design", label: "Design It", Icon: Paintbrush, hint: "3 logo concepts + color system" },
  { id: "launch", label: "Launch It", Icon: Send, hint: "Launch copy + PH copy + social" },
  { id: "promote", label: "Promote It", Icon: Radio, hint: "3 social posts + founder bio" },
];
const WORKFLOW_PLAN: Record<Exclude<WF, "auto">, { asset_type: string; count?: number }[]> = {
  brand: [{ asset_type: "logo", count: 1 }, { asset_type: "color_system" }, { asset_type: "font_system" }, { asset_type: "brand_voice" }],
  design: [{ asset_type: "logo", count: 3 }, { asset_type: "color_system" }],
  launch: [{ asset_type: "launch_copy" }, { asset_type: "product_hunt_copy" }, { asset_type: "social_post" }],
  promote: [{ asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "social_post" }, { asset_type: "founder_bio" }],
};

const SAMPLE_PROMPTS = [
  "A logo for trylaunch.ai",
  "Color system for raycast.com",
  "Product Hunt copy for typingmind.com",
  "Brand voice for an indie newsletter app",
];

const MESSAGES = [
  "Understanding your brand…",
  "Scraping context…",
  "Routing to specialist…",
  "Generating…",
  "Saving asset…",
];

const Generate = () => {
  const [params] = useSearchParams();
  const [prompt, setPrompt] = useState(params.get("prompt") ?? "");
  const [assetType, setAssetType] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WF>((params.get("workflow") as WF) || "auto");
  const projectId = params.get("project");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const nav = useNavigate();
  const autoRan = useRef(false);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    try {
      let effective: WF = workflow;
      // Auto-detect: ask classifier whether prompt is a workflow or a single asset
      if (workflow === "auto" && !assetType) {
        try {
          const { data: c } = await supabase.functions.invoke("classify-workflow", { body: { prompt: p } });
          if (c?.mode === "workflow" && c.workflow) effective = c.workflow as WF;
        } catch {}
      }
      if (effective === "auto") {
        const { data, error } = await supabase.functions.invoke("generate-asset", {
          body: { prompt: p, asset_type: assetType || undefined, project_id: projectId || undefined },
        });
        if (error) throw new Error("Rocket is busy. Please try again.");
        const d: any = data;
        if (d?.error) {
          if (d.code === "no_credits") { setOutOfCredits({ needed: d.needed, remaining: d.remaining }); return; }
          if (d.error === "ai_provider_unavailable") throw new Error(d.message);
          throw new Error(d.message || d.error);
        }
        if (d?.refused) { toast({ title: "Out of scope", description: d.message }); return; }
        const ids: string[] = d.asset_ids || [];
        if (ids.length === 0) throw new Error("No asset generated");
        if (ids.length > 1) nav(projectId ? `/projects/${projectId}` : `/assets?highlight=${ids.join(",")}`);
        else nav(`/assets/${ids[0]}`);
      } else {
        // Workflow fan-out: parallel generate-asset calls
        const plan = WORKFLOW_PLAN[effective as Exclude<WF, "auto">];
        const results = await Promise.all(plan.map(step =>
          supabase.functions.invoke("generate-asset", {
            body: { prompt: p, asset_type: step.asset_type, count: step.count, project_id: projectId || undefined },
          })
        ));
        const allIds: string[] = [];
        let creditsErr: any = null;
        for (const r of results) {
          const d: any = r.data;
          if (d?.error === "no_credits") { creditsErr = d; continue; }
          if (d?.asset_ids?.length) allIds.push(...d.asset_ids);
        }
        if (allIds.length === 0 && creditsErr) {
          setOutOfCredits({ needed: creditsErr.needed, remaining: creditsErr.remaining });
          return;
        }
        if (allIds.length === 0) throw new Error("No assets generated");
        if (creditsErr) toast({ title: "Partial result", description: "Ran out of credits before finishing the workflow." });
        nav(projectId ? `/projects/${projectId}` : `/assets?highlight=${allIds.join(",")}`);
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRan.current) return;
    if (params.get("prompt") && user) { autoRan.current = true; submit(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Create an asset</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Describe what you need. Rocket routes to the right specialist and saves it as an asset.
        </p>
      </div>

      <form onSubmit={submit} className="w-full">
        <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A logo for trylaunch.ai"
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-xl px-3 py-2 text-base outline-none placeholder:text-neutral-400 disabled:opacity-60"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {workflow === "auto" && ASSET_CHIPS.slice(0, 6).map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setAssetType(assetType === c.id ? null : c.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${assetType === c.id ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
                >
                  <c.Icon className="h-3 w-3" /> {c.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground transition hover:bg-brand-hover disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 w-full">
        <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Workflow</div>
        <div className="flex flex-wrap gap-1.5">
          {WORKFLOWS.map((w) => (
            <button
              type="button"
              key={w.id}
              onClick={() => { setWorkflow(w.id); if (w.id !== "auto") setAssetType(null); }}
              title={w.hint}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${workflow === w.id ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"}`}
            >
              <w.Icon className="h-3 w-3" /> {w.label}
            </button>
          ))}
        </div>
        {workflow !== "auto" && (
          <p className="mt-1.5 text-xs text-neutral-500">{WORKFLOWS.find(w => w.id === workflow)?.hint}</p>
        )}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-neutral-500">{MESSAGES[msgIdx]}</div>
      ) : (
        <div className="mt-8 flex w-full flex-wrap justify-center gap-2">
          {SAMPLE_PROMPTS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <OutOfCreditsModal
        open={!!outOfCredits}
        onClose={() => setOutOfCredits(null)}
        needed={outOfCredits?.needed}
        remaining={outOfCredits?.remaining}
      />
    </div>
  );
};

export default Generate;
