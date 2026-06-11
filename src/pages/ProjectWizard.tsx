import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OutOfCreditsModal from "@/components/OutOfCreditsModal";
const supabase = _sb as any;

const TONES = ["Friendly & playful", "Bold & confident", "Minimal & technical", "Warm & human", "Luxe & editorial"];
const AUDIENCES = ["Indie developers", "Founders & operators", "Designers & creatives", "SMB owners", "Consumer / general"];

const STARTERS: { type: string; label: string; prompt: (ctx: Ctx) => string }[] = [
  { type: "logo", label: "Logo", prompt: (c) => `A logo for ${c.name}${c.url ? ` (${c.url})` : ""}. ${c.description}. Audience: ${c.audience}. Tone: ${c.tone}.` },
  { type: "color_system", label: "Color system", prompt: (c) => `Color system for ${c.name}. ${c.description}. Tone: ${c.tone}.` },
  { type: "font_system", label: "Fonts", prompt: (c) => `Font pairing for ${c.name}. Tone: ${c.tone}.` },
  { type: "brand_voice", label: "Brand voice", prompt: (c) => `Brand voice for ${c.name}. Audience: ${c.audience}. Tone: ${c.tone}. ${c.description}` },
  { type: "launch_copy", label: "Launch copy", prompt: (c) => `Launch copy for ${c.name}${c.url ? ` at ${c.url}` : ""}. ${c.description}. Audience: ${c.audience}.` },
];

type Ctx = { name: string; url: string; description: string; audience: string; tone: string };

const ProjectWizard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [ctx, setCtx] = useState<Ctx>({ name: "", url: "", description: "", audience: AUDIENCES[1], tone: TONES[0] });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Record<string, "pending" | "running" | "done" | "error">>({});
  const [outOfCredits, setOutOfCredits] = useState<{ needed?: number; remaining?: number } | null>(null);

  const setF = <K extends keyof Ctx>(k: K, v: Ctx[K]) => setCtx((c) => ({ ...c, [k]: v }));

  const run = async () => {
    if (!user) return;
    setRunning(true);
    const { data: project, error } = await supabase.from("projects").insert({
      user_id: user.id, name: ctx.name.trim(), description: ctx.description.trim() || null,
    }).select().single();
    if (error || !project) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); setRunning(false); return; }

    const init: any = {}; STARTERS.forEach(s => init[s.type] = "pending"); setStatus(init);

    await Promise.all(STARTERS.map(async (s) => {
      setStatus(prev => ({ ...prev, [s.type]: "running" }));
      try {
        const { data } = await supabase.functions.invoke("generate-asset", {
          body: { prompt: s.prompt(ctx), asset_type: s.type, project_id: project.id },
        });
        const d: any = data;
        if (d?.error === "no_credits") { setOutOfCredits({ needed: d.needed, remaining: d.remaining }); setStatus(prev => ({ ...prev, [s.type]: "error" })); return; }
        if (d?.error || d?.refused) { setStatus(prev => ({ ...prev, [s.type]: "error" })); return; }
        setStatus(prev => ({ ...prev, [s.type]: "done" }));
      } catch {
        setStatus(prev => ({ ...prev, [s.type]: "error" }));
      }
    }));

    setTimeout(() => nav(`/projects/${project.id}`), 800);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <button onClick={() => (step === 0 || running) ? nav("/projects") : setStep(s => s - 1)} className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> {step === 0 || running ? "Projects" : "Back"}
      </button>

      <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
        {["Brand", "Audience", "Generate"].map((t, i) => (
          <div key={t} className={`flex items-center gap-2 ${i === step ? "text-neutral-900" : ""}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${i <= step ? "bg-brand text-brand-foreground" : "bg-neutral-200 text-neutral-500"}`}>{i + 1}</div>
            {t}{i < 2 && <span className="text-neutral-300">·</span>}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="mt-8 space-y-5">
          <h1 className="text-3xl font-semibold tracking-tight">Tell us about your brand</h1>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Brand / project name</label>
            <Input value={ctx.name} onChange={e => setF("name", e.target.value)} placeholder="TryLaunch" className="mt-1.5" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Website (optional)</label>
            <Input value={ctx.url} onChange={e => setF("url", e.target.value)} placeholder="https://trylaunch.ai" className="mt-1.5" />
            <p className="mt-1 text-xs text-neutral-500">We'll scrape it for context.</p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">One-line description</label>
            <Input value={ctx.description} onChange={e => setF("description", e.target.value)} placeholder="The fastest way to launch a SaaS product" className="mt-1.5" />
          </div>
          <Button onClick={() => setStep(1)} disabled={!ctx.name.trim() || !ctx.description.trim()} className="w-full">
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight">Who & how it feels</h1>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Primary audience</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AUDIENCES.map(a => (
                <button key={a} onClick={() => setF("audience", a)} className={`rounded-full border px-3 py-1.5 text-sm ${ctx.audience === a ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 hover:bg-neutral-50"}`}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">Tone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setF("tone", t)} className={`rounded-full border px-3 py-1.5 text-sm ${ctx.tone === t ? "border-brand bg-brand text-brand-foreground" : "border-neutral-200 hover:bg-neutral-50"}`}>{t}</button>
              ))}
            </div>
          </div>
          <Button onClick={() => setStep(2)} className="w-full">
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight">Generate your starter pack</h1>
          <p className="text-sm text-neutral-500">We'll create 5 brand assets in a new project: logo, colors, fonts, brand voice, and launch copy.</p>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            {STARTERS.map(s => {
              const st = status[s.type] || (running ? "pending" : "pending");
              return (
                <div key={s.type} className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0">
                  <div className="text-sm">{s.label}</div>
                  <div className="text-xs text-neutral-500">
                    {!running && "—"}
                    {st === "pending" && running && "Queued"}
                    {st === "running" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Generating</span>}
                    {st === "done" && <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Done</span>}
                    {st === "error" && <span className="text-red-600">Skipped</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={run} disabled={running} className="w-full">
            {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-1 h-4 w-4" /> Generate starter pack</>}
          </Button>
        </div>
      )}

      <OutOfCreditsModal open={!!outOfCredits} onClose={() => setOutOfCredits(null)} needed={outOfCredits?.needed} remaining={outOfCredits?.remaining} />
    </div>
  );
};

export default ProjectWizard;