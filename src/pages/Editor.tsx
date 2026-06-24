import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import {
  Stage, Layer, Rect, Circle as KCircle, Text as KText, Image as KImage,
  Line as KLine, RegularPolygon, Star as KStar, Transformer, Group,
} from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2,
  Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Download, Save,
  Minus, StickyNote, Table as TableIcon, Triangle as TriangleIcon, Star as StarIcon,
  Undo2, Redo2, Copy, Keyboard, LayoutTemplate, Sparkles, ArrowLeft, Check, Loader2,
  History, FilePlus,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import AddToProjectMenu from "@/components/AddToProjectMenu";
const supabase = _sb as any;

type Base = {
  id: string;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  visible: boolean;
  locked: boolean;
};
type TextEl = Base & { kind: "text"; text: string; color: string; fontSize: number; fontWeight: number; fontFamily: string; align?: "left" | "center" | "right" };
type RectEl = Base & { kind: "rect"; fill: string; radius: number };
type CircEl = Base & { kind: "circle"; fill: string };
type ImgEl  = Base & { kind: "image"; src: string };
type LineEl = Base & { kind: "line"; color: string; thickness: number };
type StickyEl = Base & { kind: "sticky"; text: string; fill: string; color: string };
type TriEl = Base & { kind: "triangle"; fill: string };
type StarEl = Base & { kind: "star"; fill: string };
type TableEl = Base & { kind: "table"; rows: number; cols: number; color: string; lineColor: string };
type El = TextEl | RectEl | CircEl | ImgEl | LineEl | StickyEl | TriEl | StarEl | TableEl;

const FONTS: string[] = [
  "Inter", "Arimo", "Montserrat", "Open Sans", "Poppins", "DM Sans",
  "Roboto", "Lato", "Oswald", "Raleway", "Nunito", "Work Sans",
  "Playfair Display", "Merriweather", "Lora", "Cormorant Garamond",
  "League Spartan", "Anton", "Archivo Black", "Bebas Neue", "Abril Fatface",
  "Pacifico", "Caveat", "Dancing Script", "Permanent Marker", "Shadows Into Light",
  "Space Grotesk", "JetBrains Mono", "IBM Plex Sans", "IBM Plex Serif",
  "Quicksand", "Karla", "Manrope", "Rubik", "Mulish", "Source Sans 3",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "rocket.editor.v2";
const STAGE_W = 800;
const STAGE_H = 600;

/* --------------------------------- Templates --------------------------------- */
const TEMPLATES: { id: string; name: string; bg: string; build: () => El[] }[] = [
  {
    id: "social-post", name: "Social Post", bg: "#0F172A",
    build: () => [
      { id: uid(), kind: "rect", x: 40, y: 40, w: 720, h: 520, visible: true, locked: false, fill: "#1E293B", radius: 24 } as RectEl,
      { id: uid(), kind: "text", x: 80, y: 110, w: 640, h: 80, visible: true, locked: false,
        text: "Big idea here.", color: "#FFFFFF", fontSize: 72, fontWeight: 800, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 80, y: 220, w: 640, h: 120, visible: true, locked: false,
        text: "Supporting line that tells the story in one breath.", color: "#94A3B8", fontSize: 28, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "rect", x: 80, y: 470, w: 180, h: 56, visible: true, locked: false, fill: "#3B82F6", radius: 999 } as RectEl,
      { id: uid(), kind: "text", x: 80, y: 486, w: 180, h: 56, visible: true, locked: false,
        text: "Learn more", color: "#FFFFFF", fontSize: 18, fontWeight: 600, fontFamily: "Inter", align: "center" } as TextEl,
    ],
  },
  {
    id: "hero-banner", name: "Hero Banner", bg: "#FAFAF7",
    build: () => [
      { id: uid(), kind: "text", x: 80, y: 180, w: 640, h: 120, visible: true, locked: false,
        text: "Make your product a brand.", color: "#0A0A0A", fontSize: 64, fontWeight: 700, fontFamily: "Playfair Display", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 80, y: 320, w: 640, h: 80, visible: true, locked: false,
        text: "Logo, copy, voice, and visuals — generated for you.", color: "#525252", fontSize: 22, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "line", x: 80, y: 430, w: 200, h: 4, visible: true, locked: false, color: "#3B82F6", thickness: 4 } as LineEl,
    ],
  },
  {
    id: "pitch-slide", name: "Pitch Slide", bg: "#FFFFFF",
    build: () => [
      { id: uid(), kind: "rect", x: 0, y: 0, w: 12, h: 600, visible: true, locked: false, fill: "#3B82F6", radius: 0 } as RectEl,
      { id: uid(), kind: "text", x: 60, y: 80, w: 680, h: 60, visible: true, locked: false,
        text: "The Problem", color: "#94A3B8", fontSize: 18, fontWeight: 600, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 130, w: 680, h: 140, visible: true, locked: false,
        text: "Founders ship products, not brands.", color: "#0A0A0A", fontSize: 52, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 320, w: 680, h: 200, visible: true, locked: false,
        text: "Hiring an agency is expensive. DIY is slow. The result: a great product wrapped in a generic shell.",
        color: "#525252", fontSize: 22, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
    ],
  },
  {
    id: "quote-card", name: "Quote Card", bg: "#111111",
    build: () => [
      { id: uid(), kind: "text", x: 80, y: 100, w: 60, h: 100, visible: true, locked: false,
        text: "\u201C", color: "#F59E0B", fontSize: 120, fontWeight: 700, fontFamily: "Playfair Display", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 80, y: 220, w: 640, h: 200, visible: true, locked: false,
        text: "The brand is the product. The product is the brand.",
        color: "#FFFFFF", fontSize: 40, fontWeight: 600, fontFamily: "Playfair Display", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 80, y: 480, w: 640, h: 40, visible: true, locked: false,
        text: "— Anonymous", color: "#A3A3A3", fontSize: 18, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
    ],
  },
  {
    id: "announcement", name: "Announcement", bg: "#FFFFFF",
    build: () => [
      { id: uid(), kind: "rect", x: 0, y: 0, w: 800, h: 120, visible: true, locked: false, fill: "#3B82F6", radius: 0 } as RectEl,
      { id: uid(), kind: "text", x: 60, y: 42, w: 680, h: 40, visible: true, locked: false,
        text: "ANNOUNCEMENT", color: "#FFFFFF", fontSize: 16, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 180, w: 680, h: 120, visible: true, locked: false,
        text: "We just shipped something big.", color: "#0A0A0A", fontSize: 56, fontWeight: 700, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 340, w: 680, h: 120, visible: true, locked: false,
        text: "Here's the one-line story that gets people to click, read, and share.",
        color: "#525252", fontSize: 22, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "rect", x: 60, y: 500, w: 200, h: 56, visible: true, locked: false, fill: "#0A0A0A", radius: 999 } as RectEl,
      { id: uid(), kind: "text", x: 60, y: 516, w: 200, h: 56, visible: true, locked: false,
        text: "Read more →", color: "#FFFFFF", fontSize: 18, fontWeight: 600, fontFamily: "Inter", align: "center" } as TextEl,
    ],
  },
  {
    id: "feature-highlight", name: "Feature Highlight", bg: "#0F172A",
    build: () => [
      { id: uid(), kind: "text", x: 60, y: 80, w: 680, h: 32, visible: true, locked: false,
        text: "NEW", color: "#22D3EE", fontSize: 14, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 130, w: 680, h: 120, visible: true, locked: false,
        text: "One-click brand kit.", color: "#FFFFFF", fontSize: 60, fontWeight: 700, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "rect", x: 60, y: 300, w: 320, h: 220, visible: true, locked: false, fill: "#1E293B", radius: 16 } as RectEl,
      { id: uid(), kind: "text", x: 84, y: 326, w: 280, h: 36, visible: true, locked: false,
        text: "Before", color: "#94A3B8", fontSize: 14, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 84, y: 360, w: 280, h: 140, visible: true, locked: false,
        text: "Weeks of agency back-and-forth.", color: "#E2E8F0", fontSize: 22, fontWeight: 500, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "rect", x: 420, y: 300, w: 320, h: 220, visible: true, locked: false, fill: "#22D3EE", radius: 16 } as RectEl,
      { id: uid(), kind: "text", x: 444, y: 326, w: 280, h: 36, visible: true, locked: false,
        text: "After", color: "#0F172A", fontSize: 14, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 444, y: 360, w: 280, h: 140, visible: true, locked: false,
        text: "A full kit in two minutes.", color: "#0F172A", fontSize: 22, fontWeight: 600, fontFamily: "Inter", align: "left" } as TextEl,
    ],
  },
  {
    id: "testimonial", name: "Testimonial", bg: "#FAFAF7",
    build: () => [
      { id: uid(), kind: "circle", x: 60, y: 80, w: 96, h: 96, visible: true, locked: false, fill: "#E5E7EB" } as CircEl,
      { id: uid(), kind: "text", x: 180, y: 96, w: 560, h: 32, visible: true, locked: false,
        text: "Alex Chen", color: "#0A0A0A", fontSize: 20, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 180, y: 128, w: 560, h: 28, visible: true, locked: false,
        text: "Founder, Linewise", color: "#737373", fontSize: 16, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 220, w: 680, h: 240, visible: true, locked: false,
        text: "\u201CRocket gave us a real brand in an afternoon. The kit is the kind of thing I'd expect to pay an agency $20k for.\u201D",
        color: "#0A0A0A", fontSize: 32, fontWeight: 500, fontFamily: "Playfair Display", align: "left" } as TextEl,
      { id: uid(), kind: "line", x: 60, y: 500, w: 80, h: 4, visible: true, locked: false, color: "#3B82F6", thickness: 4 } as LineEl,
    ],
  },
  {
    id: "stat-card", name: "Stat Card", bg: "#0A0A0A",
    build: () => [
      { id: uid(), kind: "text", x: 60, y: 90, w: 680, h: 32, visible: true, locked: false,
        text: "BY THE NUMBERS", color: "#737373", fontSize: 14, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 160, w: 680, h: 240, visible: true, locked: false,
        text: "12,000+", color: "#F59E0B", fontSize: 180, fontWeight: 800, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 420, w: 680, h: 80, visible: true, locked: false,
        text: "founders shipped a brand with Rocket this month.",
        color: "#FAFAFA", fontSize: 28, fontWeight: 500, fontFamily: "Inter", align: "left" } as TextEl,
    ],
  },
  {
    id: "cta-card", name: "CTA Card", bg: "#FFFFFF",
    build: () => [
      { id: uid(), kind: "rect", x: 40, y: 40, w: 720, h: 520, visible: true, locked: false, fill: "#0F172A", radius: 32 } as RectEl,
      { id: uid(), kind: "text", x: 80, y: 140, w: 640, h: 120, visible: true, locked: false,
        text: "Ready to launch?", color: "#FFFFFF", fontSize: 56, fontWeight: 700, fontFamily: "Space Grotesk", align: "center" } as TextEl,
      { id: uid(), kind: "text", x: 120, y: 280, w: 560, h: 80, visible: true, locked: false,
        text: "Generate your full brand kit in under two minutes — no design skills required.",
        color: "#94A3B8", fontSize: 20, fontWeight: 400, fontFamily: "Inter", align: "center" } as TextEl,
      { id: uid(), kind: "rect", x: 290, y: 420, w: 220, h: 64, visible: true, locked: false, fill: "#3B82F6", radius: 999 } as RectEl,
      { id: uid(), kind: "text", x: 290, y: 440, w: 220, h: 64, visible: true, locked: false,
        text: "Start free →", color: "#FFFFFF", fontSize: 20, fontWeight: 700, fontFamily: "Inter", align: "center" } as TextEl,
    ],
  },
  {
    id: "founder-bio", name: "Founder Bio", bg: "#FFFFFF",
    build: () => [
      { id: uid(), kind: "rect", x: 0, y: 0, w: 320, h: 600, visible: true, locked: false, fill: "#0F172A", radius: 0 } as RectEl,
      { id: uid(), kind: "circle", x: 80, y: 120, w: 160, h: 160, visible: true, locked: false, fill: "#3B82F6" } as CircEl,
      { id: uid(), kind: "text", x: 60, y: 310, w: 200, h: 32, visible: true, locked: false,
        text: "Alex Chen", color: "#FFFFFF", fontSize: 22, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 344, w: 200, h: 28, visible: true, locked: false,
        text: "Founder & CEO", color: "#94A3B8", fontSize: 16, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 360, y: 110, w: 380, h: 50, visible: true, locked: false,
        text: "About me", color: "#0A0A0A", fontSize: 36, fontWeight: 700, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 360, y: 180, w: 380, h: 320, visible: true, locked: false,
        text: "Two-time founder. I build tools that let small teams ship like big ones. Previously eng lead at Acme; YC W22. Based in SF, writing about brand, product, and small-team velocity.",
        color: "#404040", fontSize: 18, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
    ],
  },
  {
    id: "ph-launch", name: "Product Hunt Launch", bg: "#FFFFFF",
    build: () => [
      { id: uid(), kind: "rect", x: 0, y: 0, w: 800, h: 600, visible: true, locked: false, fill: "#DA552F", radius: 0 } as RectEl,
      { id: uid(), kind: "text", x: 60, y: 80, w: 680, h: 40, visible: true, locked: false,
        text: "LAUNCHING ON PRODUCT HUNT", color: "#FFD7C6", fontSize: 16, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 140, w: 680, h: 200, visible: true, locked: false,
        text: "Today's the day.", color: "#FFFFFF", fontSize: 88, fontWeight: 800, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 360, w: 680, h: 100, visible: true, locked: false,
        text: "Hunt us, upvote, and let us know what you'd ship next.",
        color: "#FFE9DD", fontSize: 24, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "rect", x: 60, y: 480, w: 240, h: 64, visible: true, locked: false, fill: "#FFFFFF", radius: 999 } as RectEl,
      { id: uid(), kind: "text", x: 60, y: 500, w: 240, h: 64, visible: true, locked: false,
        text: "Upvote on PH →", color: "#DA552F", fontSize: 18, fontWeight: 700, fontFamily: "Inter", align: "center" } as TextEl,
    ],
  },
  {
    id: "hiring", name: "We're Hiring", bg: "#FFFBEB",
    build: () => [
      { id: uid(), kind: "text", x: 60, y: 80, w: 680, h: 40, visible: true, locked: false,
        text: "WE'RE HIRING", color: "#D97706", fontSize: 16, fontWeight: 700, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 140, w: 680, h: 160, visible: true, locked: false,
        text: "Founding Engineer", color: "#1F2937", fontSize: 64, fontWeight: 700, fontFamily: "Space Grotesk", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 320, w: 680, h: 80, visible: true, locked: false,
        text: "Remote · Full-time · Equity-heavy", color: "#78716C", fontSize: 22, fontWeight: 500, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 420, w: 680, h: 80, visible: true, locked: false,
        text: "Build the tools that ship the next 1,000 brands. Ship to production daily.",
        color: "#404040", fontSize: 20, fontWeight: 400, fontFamily: "Inter", align: "left" } as TextEl,
      { id: uid(), kind: "line", x: 60, y: 530, w: 80, h: 4, visible: true, locked: false, color: "#D97706", thickness: 4 } as LineEl,
    ],
  },
  {
    id: "coming-soon", name: "Coming Soon", bg: "#0A0A0A",
    build: () => [
      { id: uid(), kind: "text", x: 60, y: 240, w: 680, h: 60, visible: true, locked: false,
        text: "COMING SOON", color: "#A3A3A3", fontSize: 22, fontWeight: 700, fontFamily: "Inter", align: "center" } as TextEl,
      { id: uid(), kind: "text", x: 60, y: 290, w: 680, h: 140, visible: true, locked: false,
        text: "Something new.", color: "#FFFFFF", fontSize: 96, fontWeight: 800, fontFamily: "Space Grotesk", align: "center" } as TextEl,
      { id: uid(), kind: "line", x: 360, y: 460, w: 80, h: 4, visible: true, locked: false, color: "#F59E0B", thickness: 4 } as LineEl,
    ],
  },
];

/* ------------------------- Image node with loader ------------------------- */
const KonvaImage = ({ el, ...rest }: { el: ImgEl; [k: string]: any }) => {
  const [img] = useImage(el.src, "anonymous");
  return (
    <KImage image={img as any} x={el.x} y={el.y} width={el.w} height={el.h} rotation={el.rotation || 0} {...rest} />
  );
};

/* --------------------------------- Editor --------------------------------- */
const Editor = () => {
  const { toast } = useToast();
  const nav = useNavigate();
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  const assetId = params.get("id");
  const [assetMeta, setAssetMeta] = useState<{ title: string; project_id: string | null } | null>(null);
  const [brandKit, setBrandKit] = useState<{ colors: string[]; fonts: string[]; logos: { id: string; url: string; title: string }[] }>({ colors: [], fonts: [], logos: [] });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  /* fonts */
  useEffect(() => {
    if (document.getElementById("rocket-editor-fonts")) return;
    const families = FONTS.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700;800`).join("&");
    const link = document.createElement("link");
    link.id = "rocket-editor-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  /* state + history */
  const [els, _setEls] = useState<El[]>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
    return [];
  });
  const [bg, setBg] = useState<string>(() => {
    try { return localStorage.getItem("rocket.editor.bg.v1") || "#ffffff"; } catch { return "#ffffff"; }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const history = useRef<{ past: El[][]; future: El[][] }>({ past: [], future: [] });

  const setEls = useCallback((updater: El[] | ((prev: El[]) => El[]), opts?: { history?: boolean }) => {
    _setEls((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      if (opts?.history !== false) {
        history.current.past.push(prev);
        if (history.current.past.length > 50) history.current.past.shift();
        history.current.future = [];
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const past = history.current.past.pop();
    if (!past) return;
    _setEls((cur) => { history.current.future.push(cur); return past; });
  }, []);
  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (!next) return;
    _setEls((cur) => { history.current.past.push(cur); return next; });
  }, []);

  /* load asset */
  useEffect(() => {
    if (!assetId) return;
    (async () => {
      const { data: a } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
      if (!a) return;
      setAssetMeta({ title: a.title || "Untitled", project_id: a.project_id || null });
      if (a.editor_state && Array.isArray(a.editor_state)) {
        _setEls(a.editor_state); return;
      }
      if (a.image_url) {
        _setEls([{ id: uid(), kind: "image", x: 150, y: 100, w: 500, h: 400, visible: true, locked: false, src: a.image_url } as ImgEl]);
      } else if (a.content) {
        _setEls([{
          id: uid(), kind: "text", x: 80, y: 200, w: 640, h: 280,
          visible: true, locked: false,
          text: String(a.content).slice(0, 800),
          color: "#0A0A0A", fontSize: 32, fontWeight: 600, fontFamily: "Inter",
        } as TextEl]);
      }
    })();
  }, [assetId]);

  /* load brand kit from sibling assets in same project */
  useEffect(() => {
    const projectId = assetMeta?.project_id;
    if (!projectId) { setBrandKit({ colors: [], fonts: [], logos: [] }); return; }
    (async () => {
      const { data } = await supabase.from("assets").select("id, title, asset_type, image_url, content")
        .eq("project_id", projectId).limit(200);
      const colors = new Set<string>();
      const fonts = new Set<string>();
      const logos: { id: string; url: string; title: string }[] = [];
      for (const a of (data || [])) {
        if (a.asset_type === "logo" && a.image_url) logos.push({ id: a.id, url: a.image_url, title: a.title });
        if (a.content) {
          const text = String(a.content);
          for (const m of text.matchAll(/#([0-9A-Fa-f]{6})\b/g)) colors.add("#" + m[1].toUpperCase());
          if (a.asset_type === "font_system") {
            for (const f of FONTS) if (text.includes(f)) fonts.add(f);
          }
        }
      }
      setBrandKit({ colors: Array.from(colors).slice(0, 24), fonts: Array.from(fonts).slice(0, 12), logos });
    })();
  }, [assetMeta?.project_id]);

  /* persist */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(els)); } catch {}
  }, [els]);
  useEffect(() => {
    try { localStorage.setItem("rocket.editor.bg.v1", bg); } catch {}
  }, [bg]);

  /* auto-save to asset (debounced) */
  const firstSave = useRef(true);
  useEffect(() => {
    if (!assetId) return;
    if (firstSave.current) { firstSave.current = false; return; }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const { error } = await supabase.from("assets").update({ editor_state: els as any }).eq("id", assetId);
      if (error) { setSaveStatus("idle"); return; }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => s === "saved" ? "idle" : s), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [els, assetId]);

  const selected = els.find((e) => e.id === selectedId) || null;

  /* attach transformer */
  useEffect(() => {
    const tr = trRef.current; if (!tr) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    if (node && selected && !selected.locked) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, els, selected]);

  const update = (id: string, patch: Partial<El>, opts?: { history?: boolean }) =>
    setEls((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as El) : e)), opts);
  const remove = (id: string) => { setEls((p) => p.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); };
  const duplicate = (id: string) => {
    const e = els.find((x) => x.id === id); if (!e) return;
    const copy = { ...e, id: uid(), x: e.x + 20, y: e.y + 20 } as El;
    setEls((p) => [...p, copy]); setSelectedId(copy.id);
  };
  const reorder = (id: string, dir: 1 | -1) => setEls((prev) => {
    const i = prev.findIndex((e) => e.id === id); if (i < 0) return prev;
    const j = i + dir; if (j < 0 || j >= prev.length) return prev;
    const copy = [...prev]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  /* add functions */
  const add = (el: El) => { setEls((p) => [...p, el]); setSelectedId(el.id); };
  const addText = () => add({ id: uid(), kind: "text", x: 280, y: 260, w: 280, h: 60, visible: true, locked: false,
    text: "Double-click to edit", color: "#111111", fontSize: 32, fontWeight: 600, fontFamily: "Inter", align: "left" } as TextEl);
  const addRect = () => add({ id: uid(), kind: "rect", x: 300, y: 240, w: 220, h: 140, visible: true, locked: false, fill: "#3b82f6", radius: 12 } as RectEl);
  const addCircle = () => add({ id: uid(), kind: "circle", x: 320, y: 240, w: 180, h: 180, visible: true, locked: false, fill: "#f97316" } as CircEl);
  const addLine = () => add({ id: uid(), kind: "line", x: 280, y: 300, w: 260, h: 4, visible: true, locked: false, color: "#3b82f6", thickness: 4 } as LineEl);
  const addSticky = () => add({ id: uid(), kind: "sticky", x: 300, y: 240, w: 180, h: 180, visible: true, locked: false, text: "Note", fill: "#FDE68A", color: "#111111" } as StickyEl);
  const addTriangle = () => add({ id: uid(), kind: "triangle", x: 320, y: 240, w: 180, h: 160, visible: true, locked: false, fill: "#10b981" } as TriEl);
  const addStar = () => add({ id: uid(), kind: "star", x: 320, y: 240, w: 160, h: 160, visible: true, locked: false, fill: "#f59e0b" } as StarEl);
  const addTable = () => add({ id: uid(), kind: "table", x: 260, y: 220, w: 320, h: 180, visible: true, locked: false, rows: 3, cols: 4, color: "#ffffff", lineColor: "#111827" } as TableEl);

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = Math.min(400, img.width); const h = w / ratio;
        add({ id: uid(), kind: "image", x: 300, y: 200, w, h, visible: true, locked: false, src } as ImgEl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  /* save / export */
  const save = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(els));
    if (assetId) {
      const { error } = await supabase.from("assets").update({ editor_state: els as any }).eq("id", assetId);
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Saved", description: assetId ? "Design saved to asset." : "Design saved locally." });
  };

  const saveVersion = async () => {
    if (!assetId) { toast({ title: "Open this design from an asset to save versions.", variant: "destructive" }); return; }
    const { data: a } = await supabase.from("assets").select("user_id, title, content, image_url").eq("id", assetId).maybeSingle();
    if (!a) return;
    const label = prompt("Label this version (optional):") ?? "";
    const { error } = await supabase.from("asset_versions").insert({
      asset_id: assetId, user_id: a.user_id, label: label || null,
      snapshot: { editor_state: els, title: a.title, content: a.content, image_url: a.image_url },
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Version saved" });
  };

  const saveAsNew = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid2 = userData?.user?.id;
    if (!uid2) { toast({ title: "Sign in to save assets", variant: "destructive" }); return; }
    const title = prompt("Name for the new asset:", assetMeta?.title ? `${assetMeta.title} (copy)` : "Untitled design") || "Untitled design";
    const stage = stageRef.current;
    let thumb: string | null = null;
    if (stage) {
      const prev = selectedId; setSelectedId(null);
      await new Promise(r => setTimeout(r, 60));
      try { thumb = stage.toDataURL({ pixelRatio: 0.5, mimeType: "image/png" }); } catch {}
      setSelectedId(prev);
    }
    const { data, error } = await supabase.from("assets").insert({
      user_id: uid2,
      project_id: assetMeta?.project_id || null,
      asset_type: "other",
      title,
      editor_state: els as any,
      thumbnail_url: thumb,
    }).select().single();
    if (error || !data) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); return; }
    toast({ title: "Saved as new asset" });
    nav(`/editor?id=${data.id}`);
  };

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id); if (!t) return;
    setBg(t.bg);
    setEls(t.build());
    setSelectedId(null);
    setShowTemplates(false);
  };

  const addImageFromUrl = (src: string) => {
    add({ id: uid(), kind: "image", x: 240, y: 180, w: 320, h: 240, visible: true, locked: false, src } as ImgEl);
  };

  const applyColorToSelected = (color: string) => {
    if (!selected) return;
    if (selected.kind === "text" || selected.kind === "sticky") update(selected.id, { color } as any);
    else if (selected.kind === "rect" || selected.kind === "circle" || selected.kind === "triangle" || selected.kind === "star") update(selected.id, { fill: color } as any);
    else if (selected.kind === "line") update(selected.id, { color } as any);
    else setBg(color);
  };

  const applyFontToSelected = (fontFamily: string) => {
    if (selected?.kind === "text") update(selected.id, { fontFamily } as any);
  };

  const exportImage = (type: "png" | "jpeg" = "png") => {
    const stage = stageRef.current; if (!stage) return;
    const prev = selectedId; setSelectedId(null);
    setTimeout(() => {
      try {
        const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: `image/${type}`, quality: 0.95 });
        const a = document.createElement("a"); a.href = dataUrl; a.download = `rocket-design.${type}`; a.click();
      } catch (e: any) {
        toast({ title: "Export failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
      setSelectedId(prev);
    }, 50);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  const buildSvg = (): string => {
    const parts: string[] = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_W}" height="${STAGE_H}" viewBox="0 0 ${STAGE_W} ${STAGE_H}">`);
    parts.push(`<rect width="${STAGE_W}" height="${STAGE_H}" fill="${bg}"/>`);
    for (const el of els) {
      if (!el.visible) continue;
      const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
      const transform = el.rotation ? ` transform="rotate(${el.rotation} ${cx} ${cy})"` : "";
      if (el.kind === "rect") {
        parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.radius}" ry="${el.radius}" fill="${el.fill}"${transform}/>`);
      } else if (el.kind === "circle") {
        parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${el.w / 2}" ry="${el.h / 2}" fill="${el.fill}"${transform}/>`);
      } else if (el.kind === "line") {
        parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.thickness}" fill="${el.color}"${transform}/>`);
      } else if (el.kind === "triangle") {
        const p = `${cx},${el.y} ${el.x},${el.y + el.h} ${el.x + el.w},${el.y + el.h}`;
        parts.push(`<polygon points="${p}" fill="${el.fill}"${transform}/>`);
      } else if (el.kind === "star") {
        const r = Math.min(el.w, el.h) / 2;
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const ang = (Math.PI / 5) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r / 2;
          pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
        }
        parts.push(`<polygon points="${pts.join(" ")}" fill="${el.fill}"${transform}/>`);
      } else if (el.kind === "sticky") {
        parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.fill}"${transform}/>`);
        parts.push(`<text x="${el.x + 12}" y="${el.y + 28}" font-family="Inter" font-size="16" fill="${el.color}"${transform}>${escapeXml(el.text)}</text>`);
      } else if (el.kind === "text") {
        const anchor = el.align === "center" ? "middle" : el.align === "right" ? "end" : "start";
        const tx = el.align === "center" ? cx : el.align === "right" ? el.x + el.w : el.x;
        const lines = el.text.split("\n");
        const lineHeight = el.fontSize * 1.2;
        const inner = lines.map((ln, i) =>
          `<tspan x="${tx}" dy="${i === 0 ? el.fontSize : lineHeight}">${escapeXml(ln)}</tspan>`,
        ).join("");
        parts.push(`<text x="${tx}" y="${el.y}" font-family="${escapeXml(el.fontFamily)}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" fill="${el.color}" text-anchor="${anchor}"${transform}>${inner}</text>`);
      } else if (el.kind === "image") {
        parts.push(`<image x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" href="${escapeXml(el.src)}" preserveAspectRatio="none"${transform}/>`);
      } else if (el.kind === "table") {
        parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.color}" stroke="${el.lineColor}"${transform}/>`);
        const cw = el.w / el.cols, rh = el.h / el.rows;
        for (let i = 1; i < el.cols; i++)
          parts.push(`<line x1="${el.x + cw * i}" y1="${el.y}" x2="${el.x + cw * i}" y2="${el.y + el.h}" stroke="${el.lineColor}"${transform}/>`);
        for (let i = 1; i < el.rows; i++)
          parts.push(`<line x1="${el.x}" y1="${el.y + rh * i}" x2="${el.x + el.w}" y2="${el.y + rh * i}" stroke="${el.lineColor}"${transform}/>`);
      }
    }
    parts.push(`</svg>`);
    return parts.join("");
  };

  const exportSvg = (target?: string) => {
    try {
      const svg = buildSvg();
      triggerDownload(new Blob([svg], { type: "image/svg+xml" }), `rocket-design.svg`);
      toast({ title: "SVG exported", description: target ? `Import this file into ${target}.` : "Editable vector file." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  const exportPsd = async () => {
    const stage = stageRef.current; if (!stage) return;
    const prev = selectedId; setSelectedId(null);
    await new Promise((r) => setTimeout(r, 60));
    try {
      const { writePsd } = await import("ag-psd");
      const canvas = stage.toCanvas({ pixelRatio: 2 }) as HTMLCanvasElement;
      // Build a layered PSD: one layer per visible element + background.
      const layers: any[] = [];
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = canvas.width; bgCanvas.height = canvas.height;
      const bgCtx = bgCanvas.getContext("2d")!;
      bgCtx.fillStyle = bg; bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      layers.push({ name: "Background", canvas: bgCanvas });
      for (const el of els) {
        if (!el.visible) continue;
        const node = nodeRefs.current[el.id]; if (!node) continue;
        try {
          const layerCanvas = (node as any).toCanvas({ pixelRatio: 2 }) as HTMLCanvasElement;
          const left = Math.round(el.x * 2);
          const top = Math.round(el.y * 2);
          layers.push({
            name: el.kind + ((el as any).text ? `: ${(el as any).text.slice(0, 24)}` : ""),
            canvas: layerCanvas,
            left, top,
            right: left + layerCanvas.width,
            bottom: top + layerCanvas.height,
          });
        } catch {}
      }
      const psd = {
        width: canvas.width,
        height: canvas.height,
        canvas,
        children: layers,
      };
      const buffer = writePsd(psd as any);
      triggerDownload(new Blob([buffer], { type: "image/vnd.adobe.photoshop" }), `rocket-design.psd`);
      toast({ title: "PSD exported", description: "Open in Adobe Photoshop." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message || "Unknown error", variant: "destructive" });
    } finally {
      setSelectedId(prev);
    }
  };

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(selectedId); return; }
      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); duplicate(selectedId); return; }
      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft")  { e.preventDefault(); update(selectedId, { x: (selected!.x - step) } as any); }
      if (e.key === "ArrowRight") { e.preventDefault(); update(selectedId, { x: (selected!.x + step) } as any); }
      if (e.key === "ArrowUp")    { e.preventDefault(); update(selectedId, { y: (selected!.y - step) } as any); }
      if (e.key === "ArrowDown")  { e.preventDefault(); update(selectedId, { y: (selected!.y + step) } as any); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selected, undo, redo]);

  /* inline text editor overlay */
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const editingEl = els.find((e) => e.id === editingTextId && (e.kind === "text" || e.kind === "sticky"));

  const onTransformEnd = (id: string) => {
    const node = nodeRefs.current[id]; if (!node) return;
    const sx = node.scaleX(); const sy = node.scaleY();
    node.scaleX(1); node.scaleY(1);
    const el = els.find((e) => e.id === id); if (!el) return;
    const isCentered = el.kind === "circle" || el.kind === "triangle" || el.kind === "star";
    const newW = Math.max(8, el.w * sx);
    const newH = Math.max(8, el.h * sy);
    const patch: any = {
      x: isCentered ? node.x() - newW / 2 : node.x(),
      y: isCentered ? node.y() - newH / 2 : node.y(),
      rotation: node.rotation(),
      w: newW,
      h: newH,
    };
    if (el.kind === "text") patch.fontSize = Math.max(6, (el as TextEl).fontSize * ((sx + sy) / 2));
    update(id, patch);
  };

  const renderNode = (el: El) => {
    if (!el.visible) return null;
    const common = {
      key: el.id,
      ref: (n: any) => { nodeRefs.current[el.id] = n; },
      draggable: !el.locked,
      onClick: () => setSelectedId(el.id),
      onTap: () => setSelectedId(el.id),
      onDragEnd: (e: any) => update(el.id, { x: e.target.x(), y: e.target.y() } as any),
      onTransformEnd: () => onTransformEnd(el.id),
    };
    if (el.kind === "rect") return <Rect {...common} x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} cornerRadius={el.radius} rotation={el.rotation || 0} />;
    if (el.kind === "circle") {
      const r = Math.min(el.w, el.h) / 2;
      return (
        <KCircle {...common}
          x={el.x + el.w / 2} y={el.y + el.h / 2}
          radius={r}
          offsetX={0} offsetY={0}
          fill={el.fill} rotation={el.rotation || 0}
          onDragEnd={(e: any) => update(el.id, { x: e.target.x() - el.w / 2, y: e.target.y() - el.h / 2 } as any)}
        />
      );
    }
    if (el.kind === "text") return (
      <KText {...common}
        x={el.x} y={el.y} width={el.w} text={el.text}
        fill={el.color} fontSize={el.fontSize}
        fontStyle={el.fontWeight >= 600 ? "bold" : "normal"}
        fontFamily={el.fontFamily} align={el.align || "left"}
        rotation={el.rotation || 0}
        onDblClick={() => setEditingTextId(el.id)}
        onDblTap={() => setEditingTextId(el.id)}
      />
    );
    if (el.kind === "image") return <KonvaImage {...common} el={el} />;
    if (el.kind === "line") return (
      <KLine {...common}
        x={el.x} y={el.y}
        points={[0, el.h / 2, el.w, el.h / 2]}
        stroke={el.color} strokeWidth={el.thickness} lineCap="round"
        rotation={el.rotation || 0}
        hitStrokeWidth={Math.max(12, el.thickness)}
      />
    );
    if (el.kind === "sticky") return (
      <>
        <Rect {...common} x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} cornerRadius={4} shadowBlur={6} shadowOpacity={0.15} rotation={el.rotation || 0} />
        <KText x={el.x + 10} y={el.y + 10} width={el.w - 20} height={el.h - 20} text={el.text} fontSize={16} fill={el.color} listening={false} rotation={el.rotation || 0} />
      </>
    );
    if (el.kind === "triangle") return (
      <RegularPolygon {...common}
        x={el.x + el.w / 2} y={el.y + el.h / 2}
        sides={3} radius={Math.min(el.w, el.h) / 2}
        fill={el.fill} rotation={el.rotation || 0}
        onDragEnd={(e: any) => update(el.id, { x: e.target.x() - el.w / 2, y: e.target.y() - el.h / 2 } as any)}
      />
    );
    if (el.kind === "star") return (
      <KStar {...common}
        x={el.x + el.w / 2} y={el.y + el.h / 2}
        numPoints={5}
        innerRadius={Math.min(el.w, el.h) / 4}
        outerRadius={Math.min(el.w, el.h) / 2}
        fill={el.fill} rotation={el.rotation || 0}
        onDragEnd={(e: any) => update(el.id, { x: e.target.x() - el.w / 2, y: e.target.y() - el.h / 2 } as any)}
      />
    );
    if (el.kind === "table") {
      const lines: any[] = [];
      for (let r = 0; r <= el.rows; r++) {
        const y = (el.h / el.rows) * r;
        lines.push(<KLine key={`r${r}`} points={[0, y, el.w, y]} stroke={el.lineColor} strokeWidth={1} listening={false} />);
      }
      for (let c = 0; c <= el.cols; c++) {
        const x = (el.w / el.cols) * c;
        lines.push(<KLine key={`c${c}`} points={[x, 0, x, el.h]} stroke={el.lineColor} strokeWidth={1} listening={false} />);
      }
      return (
        <Group {...common} x={el.x} y={el.y} rotation={el.rotation || 0}>
          <Rect x={0} y={0} width={el.w} height={el.h} fill={el.color} />
          {lines}
        </Group>
      );
    }
    return null;
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full bg-neutral-100">
      {/* Mobile warning */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-8 text-center md:hidden">
        <LayoutTemplate className="mb-3 h-8 w-8 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-900">Editor is desktop-only</p>
        <p className="mt-1 text-xs text-neutral-500">Open Rocket on a larger screen to design.</p>
      </div>
      <div className="flex flex-1">
      {/* Left */}
      <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Add</p>
          <div className="grid grid-cols-4 gap-1.5">
            <ToolBtn onClick={addText} label="Text"><Type className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addRect} label="Rect"><Square className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addCircle} label="Circle"><CircleIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addTriangle} label="Triangle"><TriangleIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addStar} label="Star"><StarIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addLine} label="Line"><Minus className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addSticky} label="Sticky"><StickyNote className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={addTable} label="Table"><TableIcon className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={() => fileRef.current?.click()} label="Image"><ImageIcon className="h-4 w-4" /></ToolBtn>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
        </div>
        <div className="border-b border-neutral-200 p-3">
          <label className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-neutral-500">
            Canvas background
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-6 w-8 cursor-pointer rounded border border-neutral-200" />
          </label>
        </div>

        {/* Brand Kit */}
        {(brandKit.colors.length + brandKit.fonts.length + brandKit.logos.length) > 0 && (
          <div className="border-b border-neutral-200 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
              <Sparkles className="h-3 w-3" /> Brand Kit
            </p>
            {brandKit.colors.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">Colors</p>
                <div className="flex flex-wrap gap-1.5">
                  {brandKit.colors.map((c) => (
                    <button key={c} title={c} onClick={() => applyColorToSelected(c)}
                      className="h-6 w-6 rounded border border-neutral-200 transition hover:scale-110"
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            )}
            {brandKit.fonts.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">Fonts</p>
                <div className="space-y-1">
                  {brandKit.fonts.map((f) => (
                    <button key={f} onClick={() => applyFontToSelected(f)}
                      className="w-full rounded border border-neutral-200 px-2 py-1 text-left text-xs hover:bg-neutral-50"
                      style={{ fontFamily: `'${f}', sans-serif` }}>{f}</button>
                  ))}
                </div>
              </div>
            )}
            {brandKit.logos.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">Logos</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {brandKit.logos.map((l) => (
                    <button key={l.id} onClick={() => addImageFromUrl(l.url)} title={l.title}
                      className="aspect-square overflow-hidden rounded border border-neutral-200 bg-neutral-50 hover:border-brand">
                      <img src={l.url} alt={l.title} className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Layers</p>
          {els.length === 0 && <p className="text-xs text-neutral-400">No layers yet.</p>}
          <ul className="space-y-1">
            {[...els].reverse().map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelectedId(e.id)}
                  className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${selectedId === e.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  <span className="flex-1 truncate capitalize">{e.kind}{e.kind === "text" ? `: ${(e as TextEl).text.slice(0, 16)}` : ""}</span>
                  <span onClick={(ev) => { ev.stopPropagation(); update(e.id, { visible: !e.visible } as any); }} className="opacity-60 hover:opacity-100">
                    {e.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </span>
                  <span onClick={(ev) => { ev.stopPropagation(); update(e.id, { locked: !e.locked } as any); }} className="opacity-60 hover:opacity-100">
                    {e.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Center */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
          {assetMeta?.project_id ? (
            <Link to={`/projects/${assetMeta.project_id}`} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
              <ArrowLeft className="h-3 w-3" /> Project
            </Link>
          ) : assetId ? (
            <Link to={`/assets/${assetId}`} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
              <ArrowLeft className="h-3 w-3" /> Asset
            </Link>
          ) : null}
          <span className="text-sm font-medium text-neutral-700">{assetMeta?.title || "Untitled design"}</span>
          <span className="ml-2 text-xs text-neutral-400">{STAGE_W} × {STAGE_H}</span>
          {assetId && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-neutral-400">
              {saveStatus === "saving" && (<><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>)}
              {saveStatus === "saved" && (<><Check className="h-3 w-3 text-green-600" /> Saved</>)}
            </span>
          )}
          <div className="ml-3 flex items-center gap-1">
            <IconAction onClick={undo} label="Undo"><Undo2 className="h-3.5 w-3.5" /></IconAction>
            <IconAction onClick={redo} label="Redo"><Redo2 className="h-3.5 w-3.5" /></IconAction>
            <div className="relative">
              <IconAction onClick={() => setShowTemplates((v) => !v)} label="Templates"><LayoutTemplate className="h-3.5 w-3.5" /></IconAction>
              {showTemplates && (
                <div className="absolute left-0 top-9 z-30 w-56 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
                  <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400">Replace canvas</p>
                  {TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => applyTemplate(t.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-neutral-100">
                      <span className="h-4 w-4 rounded border border-neutral-200" style={{ background: t.bg }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <IconAction onClick={() => setShowShortcuts(true)} label="Shortcuts"><Keyboard className="h-3.5 w-3.5" /></IconAction>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {assetId && (
              <AddToProjectMenu
                assetId={assetId}
                currentProjectId={assetMeta?.project_id || null}
                onChanged={(pid) => setAssetMeta((m) => m ? { ...m, project_id: pid } : m)}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
              />
            )}
            {assetId && (
              <Button variant="outline" size="sm" onClick={saveVersion}><History className="h-3.5 w-3.5" /> Version</Button>
            )}
            <Button variant="outline" size="sm" onClick={saveAsNew}><FilePlus className="h-3.5 w-3.5" /> Save as new</Button>
            <Button variant="outline" size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => exportImage("png")}>PNG image</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportImage("jpeg")}>JPG image</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPsd}>Photoshop (.psd)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSvg("Figma")}>Figma (SVG)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSvg("Sketch")}>Sketch (SVG)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportSvg("Canva")}>Canva (SVG)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center overflow-auto p-8">
          <div className="relative shadow-xl" style={{ width: STAGE_W, height: STAGE_H }}>
            <Stage
              ref={stageRef}
              width={STAGE_W}
              height={STAGE_H}
              onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
              onTouchStart={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
              <Layer listening={false}>
                <Rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={bg} />
              </Layer>
              <Layer>
                {els.map(renderNode)}
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  anchorSize={8}
                  borderStroke="#3b82f6"
                  anchorStroke="#3b82f6"
                  anchorFill="#ffffff"
                  boundBoxFunc={(_oldBox, newBox) => newBox.width < 8 || newBox.height < 8 ? _oldBox : newBox}
                />
              </Layer>
            </Stage>

            {/* Inline text editor overlay */}
            {editingEl && (
              <textarea
                autoFocus
                defaultValue={(editingEl as any).text}
                onBlur={(e) => {
                  update(editingEl.id, { text: e.target.value } as any);
                  setEditingTextId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setEditingTextId(null); }
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur();
                }}
                style={{
                  position: "absolute",
                  left: editingEl.x, top: editingEl.y,
                  width: editingEl.w, minHeight: editingEl.h,
                  fontFamily: (editingEl as any).fontFamily || "Inter",
                  fontSize: (editingEl as any).fontSize || 16,
                  fontWeight: (editingEl as any).fontWeight || 400,
                  color: (editingEl as any).color || "#111",
                  background: editingEl.kind === "sticky" ? (editingEl as StickyEl).fill : "transparent",
                  border: "2px dashed #3b82f6",
                  padding: editingEl.kind === "sticky" ? 8 : 0,
                  resize: "none", outline: "none", lineHeight: 1.2,
                  transform: `rotate(${editingEl.rotation || 0}deg)`,
                  transformOrigin: "top left",
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Right */}
      <aside className="w-72 border-l border-neutral-200 bg-white p-4 overflow-y-auto">
        {!selected && <p className="text-xs text-neutral-400">Select a layer to edit its properties.</p>}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize text-neutral-900">{selected.kind}</p>
              <div className="flex items-center gap-1">
                <IconAction onClick={() => reorder(selected.id, 1)} label="Up"><ArrowUp className="h-3.5 w-3.5" /></IconAction>
                <IconAction onClick={() => reorder(selected.id, -1)} label="Down"><ArrowDown className="h-3.5 w-3.5" /></IconAction>
                <IconAction onClick={() => duplicate(selected.id)} label="Duplicate"><Copy className="h-3.5 w-3.5" /></IconAction>
                <IconAction onClick={() => remove(selected.id)} label="Delete"><Trash2 className="h-3.5 w-3.5" /></IconAction>
              </div>
            </div>
            <Inspector el={selected} onChange={(patch) => update(selected.id, patch as any)} />
            <div className="border-t border-neutral-200 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Position</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="X"><NumberInput value={Math.round(selected.x)} onChange={(e: any) => update(selected.id, { x: +e.target.value } as any)} /></Field>
                <Field label="Y"><NumberInput value={Math.round(selected.y)} onChange={(e: any) => update(selected.id, { y: +e.target.value } as any)} /></Field>
                <Field label="W"><NumberInput value={Math.round(selected.w)} onChange={(e: any) => update(selected.id, { w: +e.target.value } as any)} /></Field>
                <Field label="H"><NumberInput value={Math.round(selected.h)} onChange={(e: any) => update(selected.id, { h: +e.target.value } as any)} /></Field>
                <Field label="Rot°"><NumberInput value={Math.round(selected.rotation || 0)} onChange={(e: any) => update(selected.id, { rotation: +e.target.value } as any)} /></Field>
              </div>
            </div>
          </div>
        )}
      </aside>
      </div>
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setShowShortcuts(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Undo", "Ctrl/⌘ + Z"],
                ["Redo", "Ctrl/⌘ + Y or Shift + Ctrl/⌘ + Z"],
                ["Duplicate", "Ctrl/⌘ + D"],
                ["Delete", "Delete / Backspace"],
                ["Nudge", "Arrow keys (Shift = 10px)"],
                ["Edit text", "Double-click text"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-700">{k}</span>
                  <kbd className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">{v}</kbd>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => setShowShortcuts(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolBtn = ({ onClick, label, children }: any) => (
  <button onClick={onClick} title={label} className="grid h-9 place-items-center rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900">{children}</button>
);
const IconAction = ({ onClick, label, children }: any) => (
  <button onClick={onClick} title={label} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">{children}</button>
);

const Field = ({ label, children }: any) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
    {children}
  </label>
);
const NumberInput = (p: any) => <input type="number" {...p} className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-300" />;
const ColorInput = (p: any) => <input type="color" {...p} className="h-9 w-full cursor-pointer rounded-md border border-neutral-200" />;

const Inspector = ({ el, onChange }: { el: El; onChange: (p: Partial<El>) => void }) => {
  if (el.kind === "text") return (
    <div className="space-y-3">
      <Field label="Text"><textarea value={el.text} onChange={(e) => onChange({ text: e.target.value } as any)} rows={3} className="w-full resize-y rounded-md border border-neutral-200 px-2 py-1.5 text-sm" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Size"><NumberInput value={el.fontSize} onChange={(e: any) => onChange({ fontSize: +e.target.value } as any)} /></Field>
        <Field label="Weight"><NumberInput value={el.fontWeight} step={100} min={100} max={900} onChange={(e: any) => onChange({ fontWeight: +e.target.value } as any)} /></Field>
      </div>
      <Field label="Color"><ColorInput value={el.color} onChange={(e: any) => onChange({ color: e.target.value } as any)} /></Field>
      <Field label="Align">
        <select value={el.align || "left"} onChange={(e) => onChange({ align: e.target.value as any } as any)}
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm">
          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
        </select>
      </Field>
      <Field label="Font">
        <select value={el.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value } as any)}
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm">
          {FONTS.map((f) => (<option key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>{f}</option>))}
        </select>
      </Field>
    </div>
  );
  if (el.kind === "rect") return (
    <div className="space-y-3">
      <Field label="Fill"><ColorInput value={el.fill} onChange={(e: any) => onChange({ fill: e.target.value } as any)} /></Field>
      <Field label="Corner radius"><NumberInput value={el.radius} min={0} onChange={(e: any) => onChange({ radius: +e.target.value } as any)} /></Field>
    </div>
  );
  if (el.kind === "circle" || el.kind === "triangle" || el.kind === "star") return (
    <Field label="Fill"><ColorInput value={(el as any).fill} onChange={(e: any) => onChange({ fill: e.target.value } as any)} /></Field>
  );
  if (el.kind === "line") return (
    <div className="space-y-3">
      <Field label="Color"><ColorInput value={el.color} onChange={(e: any) => onChange({ color: e.target.value } as any)} /></Field>
      <Field label="Thickness"><NumberInput value={el.thickness} min={1} max={40} onChange={(e: any) => onChange({ thickness: +e.target.value } as any)} /></Field>
    </div>
  );
  if (el.kind === "sticky") return (
    <div className="space-y-3">
      <Field label="Text"><textarea value={el.text} onChange={(e) => onChange({ text: e.target.value } as any)} rows={3} className="w-full resize-y rounded-md border border-neutral-200 px-2 py-1.5 text-sm" /></Field>
      <Field label="Background"><ColorInput value={el.fill} onChange={(e: any) => onChange({ fill: e.target.value } as any)} /></Field>
      <Field label="Text color"><ColorInput value={el.color} onChange={(e: any) => onChange({ color: e.target.value } as any)} /></Field>
    </div>
  );
  if (el.kind === "table") return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rows"><NumberInput value={el.rows} min={1} max={20} onChange={(e: any) => onChange({ rows: Math.max(1, +e.target.value) } as any)} /></Field>
        <Field label="Columns"><NumberInput value={el.cols} min={1} max={20} onChange={(e: any) => onChange({ cols: Math.max(1, +e.target.value) } as any)} /></Field>
      </div>
      <Field label="Cell color"><ColorInput value={el.color} onChange={(e: any) => onChange({ color: e.target.value } as any)} /></Field>
      <Field label="Line color"><ColorInput value={el.lineColor} onChange={(e: any) => onChange({ lineColor: e.target.value } as any)} /></Field>
    </div>
  );
  return <p className="text-xs text-neutral-500">Use the transformer handles to resize and rotate.</p>;
};

export default Editor;