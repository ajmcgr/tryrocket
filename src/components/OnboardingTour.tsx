import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { X, ArrowRight, Sparkles } from "lucide-react";

type Step = {
  selector?: string;
  title: string;
  body: string;
  cta?: string;
  placement?: "bottom" | "right" | "left" | "center";
};

const STORAGE_KEY = "rocket.onboarding.v1";

const STEPS: Step[] = [
  {
    title: "Welcome to Rocket",
    body: "A 60-second tour of how to take an idea from prompt to launch-ready brand assets.",
    placement: "center",
    cta: "Start tour",
  },
  {
    selector: '[data-tour="nav-create"]',
    title: "Start with Create",
    body: "Describe your idea or drop a URL. Rocket scrapes it, builds positioning, and drafts your brand voice.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-projects"]',
    title: "Group work in Projects",
    body: "Keep colors, logos, copy, and exports for each brand together. Use the guided wizard for a full kit.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-assets"]',
    title: "Your asset library",
    body: "Every generated logo, palette, and post lives here. Version history, share links, and exports built in.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-editor"]',
    title: "Refine in Editor",
    body: "Tweak any asset, regenerate variants, or compose multi-format launch pages.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="nav-insights"]',
    title: "Track your output",
    body: "Daily activity, credit usage, and your most recent work — all in one dashboard.",
    placement: "bottom",
  },
  {
    title: "You're set",
    body: "Jump into Create and ship your first asset. You can replay this tour anytime from Settings.",
    placement: "center",
    cta: "Start creating",
  },
];

const PAD = 8;

const OnboardingTour = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Auto-open once per user on first sign-in
  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}.${user.id}`;
    if (!localStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  // Allow programmatic re-launch
  useEffect(() => {
    const h = () => { setIdx(0); setOpen(true); };
    window.addEventListener("rocket:start-tour", h);
    return () => window.removeEventListener("rocket:start-tour", h);
  }, []);

  const step = STEPS[idx];

  const measure = useCallback(() => {
    if (!step?.selector) { setRect(null); return; }
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("scroll", measure, true); window.removeEventListener("resize", measure); };
  }, [open, measure]);

  const finish = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}.${user.id}`, "1");
    setOpen(false);
  };

  if (!open || !step) return null;

  const last = idx === STEPS.length - 1;
  const tipStyle: React.CSSProperties = (() => {
    if (!rect || step.placement === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const top = rect.bottom + PAD;
    const left = Math.min(window.innerWidth - 360 - 16, Math.max(16, rect.left + rect.width / 2 - 160));
    return { top, left };
  })();

  const next = () => {
    if (last) {
      finish();
      nav("/create");
    } else setIdx(i => i + 1);
  };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* Overlay with cut-out using SVG mask */}
      <svg className="absolute inset-0 h-full w-full pointer-events-auto" onClick={finish}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && step.placement !== "center" && (
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,23,42,0.55)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight ring */}
      {rect && step.placement !== "center" && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-white/90 ring-offset-2 ring-offset-transparent shadow-[0_0_0_4px_rgba(255,255,255,0.15)] transition-all"
          style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-[320px] sm:w-[360px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl"
        style={tipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Step {idx + 1} of {STEPS.length}
            </div>
          </div>
          <button onClick={finish} aria-label="Skip tour" className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-tight text-neutral-900">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{step.body}</p>

        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all ${i === idx ? "w-5 bg-neutral-900" : i < idx ? "w-1.5 bg-neutral-400" : "w-1.5 bg-neutral-200"}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={finish} className="text-xs font-medium text-neutral-500 hover:text-neutral-800">
            Skip
          </button>
          <div className="flex items-center gap-2">
            {idx > 0 && !last && (
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                Back
              </button>
            )}
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              {step.cta || (last ? "Finish" : "Next")}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;