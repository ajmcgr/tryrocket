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
      const { error } = await supabase.from("assets").update({ editor_state: els }).eq("id", assetId);
      if (!error) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1200);
      } else {
        setSaveStatus("idle");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [els, assetId]);

  /* helpers */
  const selected = useMemo(() => els.find((e) => e.id === selectedId) || null, [els, selectedId]);
  const editingEl = useMemo(() => selected && (selected.kind === "text" || selected.kind === "sticky") ? selected : null, [selected]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  useEffect(() => {
    const tr = trRef.current;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    if (tr && node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else if (tr) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, els]);

  const update = (id: string, patch: Partial<El>) => setEls((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } as El : e));
  const remove = (id: string) => { setEls((prev) => prev.filter((e) => e.id !== id)); setSelectedId((cur) => cur === id ? null : cur); };
  const duplicate = (id: string) => setEls((prev) => {
    const src = prev.find((e) => e.id === id);
    if (!src) return prev;
    const copy = { ...src, id: uid(), x: src.x + 20, y: src.y + 20 } as El;
    return [...prev, copy];
  });
  const reorder = (id: string, dir: 1 | -1) => setEls((prev) => {
    const idx = prev.findIndex((e) => e.id === id); if (idx < 0) return prev;
    const ni = Math.min(prev.length - 1, Math.max(0, idx + dir));
    const arr = [...prev]; const [item] = arr.splice(idx, 1); arr.splice(ni, 0, item); return arr;
  });
  const clearSelection = () => setSelectedId(null);

  const addText = () => {
    const id = uid();
    const el: TextEl = { id, kind: "text", x: 90, y: 90, w: 320, h: 50, visible: true, locked: false, text: "Edit text", color: "#111111", fontSize: 40, fontWeight: 700, fontFamily: "Inter", align: "left" };
    setEls((prev) => [...prev, el]); setSelectedId(id); setEditingTextId(id);
  };
  const addRect = () => { const id = uid(); setEls((p) => [...p, { id, kind: "rect", x: 120, y: 120, w: 180, h: 120, visible: true, locked: false, fill: "#E5E7EB", radius: 12 } as RectEl]); setSelectedId(id); };
  const addCircle = () => { const id = uid(); setEls((p) => [...p, { id, kind: "circle", x: 180, y: 150, w: 120, h: 120, visible: true, locked: false, fill: "#93C5FD" } as CircEl]); setSelectedId(id); };
  const addLine = () => { const id = uid(); setEls((p) => [...p, { id, kind: "line", x: 120, y: 260, w: 220, h: 0, visible: true, locked: false, color: "#111111", thickness: 4 } as LineEl]); setSelectedId(id); };
  const addSticky = () => { const id = uid(); setEls((p) => [...p, { id, kind: "sticky", x: 140, y: 120, w: 220, h: 140, visible: true, locked: false, text: "Sticky note", fill: "#FEF08A", color: "#111111" } as StickyEl]); setSelectedId(id); setEditingTextId(id); };
  const addTriangle = () => { const id = uid(); setEls((p) => [...p, { id, kind: "triangle", x: 220, y: 160, w: 120, h: 120, visible: true, locked: false, fill: "#C4B5FD" } as TriEl]); setSelectedId(id); };
  const addStar = () => { const id = uid(); setEls((p) => [...p, { id, kind: "star", x: 260, y: 180, w: 140, h: 140, visible: true, locked: false, fill: "#FDE68A" } as StarEl]); setSelectedId(id); };
  const addTable = () => { const id = uid(); setEls((p) => [...p, { id, kind: "table", x: 100, y: 140, w: 360, h: 220, visible: true, locked: false, rows: 4, cols: 3, color: "#FFFFFF", lineColor: "#CBD5E1" } as TableEl]); setSelectedId(id); };

  const onUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const id = uid();
      const src = String(reader.result || "");
      setEls((p) => [...p, { id, kind: "image", x: 120, y: 120, w: 320, h: 240, visible: true, locked: false, src } as ImgEl]);
      setSelectedId(id);
    };
    reader.readAsDataURL(file);
  };

  const addImageFromUrl = (url: string) => {
    const id = uid();
    setEls((p) => [...p, { id, kind: "image", x: 120, y: 120, w: 320, h: 240, visible: true, locked: false, src: url } as ImgEl]);
    setSelectedId(id);
  };

  const save = async () => {
    if (assetId) {
      const { error } = await supabase.from("assets").update({ editor_state: els }).eq("id", assetId);
      if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
      else toast({ title: "Saved" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return nav("/auth");
    const { data, error } = await supabase.from("assets").insert({ user_id: user.id, asset_type: "graphic", title: "Canvas design", editor_state: els }).select("id").single();
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); nav(`/editor?id=${data.id}`); }
  };

  const saveAsNew = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return nav("/auth");
    const { data, error } = await supabase.from("assets").insert({ user_id: user.id, asset_type: "graphic", title: `${assetMeta?.title || "Canvas design"} copy`, editor_state: els, project_id: assetMeta?.project_id || null }).select("id").single();
    if (error) toast({ title: "Save as new failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved as new" }); nav(`/editor?id=${data.id}`); }
  };

  const saveVersion = async () => {
    if (!assetId) return;
    const { error } = await supabase.from("asset_versions").insert({ asset_id: assetId, editor_state: els });
    if (error) toast({ title: "Version failed", description: error.message, variant: "destructive" });
    else toast({ title: "Version saved" });
  };

  const exportImage = (type: "png" | "jpeg") => {
    const uri = stageRef.current?.toDataURL({ pixelRatio: 2, mimeType: type === "png" ? "image/png" : "image/jpeg", quality: 0.95 });
    if (!uri) return;
    const a = document.createElement("a");
    a.href = uri; a.download = `rocket-canvas.${type === "png" ? "png" : "jpg"}`; a.click();
  };

  const exportSvg = (toolName: string) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_W}" height="${STAGE_H}" viewBox="0 0 ${STAGE_W} ${STAGE_H}">
  <rect width="100%" height="100%" fill="${bg}" />
  ${els.map((e) => {
    if (!e.visible) return "";
    const rot = e.rotation ? ` transform="rotate(${e.rotation} ${e.x + e.w/2} ${e.y + e.h/2})"` : "";
    if (e.kind === "rect") return `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="${e.radius}" fill="${e.fill}"${rot} />`;
    if (e.kind === "circle") return `<ellipse cx="${e.x + e.w/2}" cy="${e.y + e.h/2}" rx="${e.w/2}" ry="${e.h/2}" fill="${e.fill}"${rot} />`;
    if (e.kind === "triangle") {
      const pts = `${e.x + e.w/2},${e.y} ${e.x + e.w},${e.y + e.h} ${e.x},${e.y + e.h}`;
      return `<polygon points="${pts}" fill="${e.fill}"${rot} />`;
    }
    if (e.kind === "star") {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, r = Math.min(e.w, e.h) / 2;
      const pts = Array.from({ length: 10 }).map((_, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI / 5);
        const rr = i % 2 === 0 ? r : r * 0.45;
        return `${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`;
      }).join(" ");
      return `<polygon points="${pts}" fill="${e.fill}"${rot} />`;
    }
    if (e.kind === "line") return `<line x1="${e.x}" y1="${e.y}" x2="${e.x + e.w}" y2="${e.y + e.h}" stroke="${e.color}" stroke-width="${e.thickness}" stroke-linecap="round"${rot} />`;
    if (e.kind === "text") return `<text x="${e.x}" y="${e.y + e.fontSize}" fill="${e.color}" font-size="${e.fontSize}" font-family="${e.fontFamily}" font-weight="${e.fontWeight}"${rot}>${(e.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`;
    if (e.kind === "sticky") {
      const safe = (e.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<g${rot}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${e.fill}" rx="10" /><text x="${e.x + 10}" y="${e.y + 26}" fill="${e.color}" font-size="18" font-family="Inter">${safe}</text></g>`;
    }
    if (e.kind === "image") return `<image href="${e.src}" x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}"${rot} />`;
    if (e.kind === "table") {
      const rows = Array.from({ length: e.rows + 1 }).map((_, r) => `<line x1="${e.x}" y1="${e.y + (e.h / e.rows) * r}" x2="${e.x + e.w}" y2="${e.y + (e.h / e.rows) * r}" stroke="${e.lineColor}" stroke-width="1" />`).join("");
      const cols = Array.from({ length: e.cols + 1 }).map((_, c) => `<line x1="${e.x + (e.w / e.cols) * c}" y1="${e.y}" x2="${e.x + (e.w / e.cols) * c}" y2="${e.y + e.h}" stroke="${e.lineColor}" stroke-width="1" />`).join("");
      return `<g${rot}><rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${e.color}" />${rows}${cols}</g>`;
    }
    return "";
  }).join("\n  ")}
</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rocket-canvas-for-${toolName.toLowerCase()}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPsd = async () => {
    const { writePsd } = await import("ag-psd");
    const stage = stageRef.current;
    if (!stage) return;
    const base = new OffscreenCanvas ? new OffscreenCanvas(STAGE_W, STAGE_H) : document.createElement("canvas");
    (base as any).width = STAGE_W; (base as any).height = STAGE_H;
    const ctx: any = (base as any).getContext("2d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    const children = [...els];
    const canvasToPngBytes = async (canvas: HTMLCanvasElement | OffscreenCanvas) => {
      if ((canvas as any).convertToBlob) {
        const blob = await (canvas as any).convertToBlob({ type: "image/png" });
        return new Uint8Array(await blob.arrayBuffer());
      }
      const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png");
      const b64 = dataUrl.split(",")[1];
      const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
    };
    const layers: any[] = [];
    for (const e of children) {
      if (!e.visible) continue;
      const c: any = document.createElement("canvas"); c.width = STAGE_W; c.height = STAGE_H;
      const cctx = c.getContext("2d")!;
      cctx.save();
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      cctx.translate(cx, cy); cctx.rotate(((e.rotation || 0) * Math.PI) / 180); cctx.translate(-cx, -cy);
      if (e.kind === "rect") {
        cctx.fillStyle = e.fill;
        const r = e.radius;
        cctx.beginPath();
        cctx.moveTo(e.x + r, e.y);
        cctx.arcTo(e.x + e.w, e.y, e.x + e.w, e.y + e.h, r);
        cctx.arcTo(e.x + e.w, e.y + e.h, e.x, e.y + e.h, r);
        cctx.arcTo(e.x, e.y + e.h, e.x, e.y, r);
        cctx.arcTo(e.x, e.y, e.x + e.w, e.y, r);
        cctx.closePath(); cctx.fill();
      } else if (e.kind === "circle") {
        cctx.fillStyle = e.fill; cctx.beginPath(); cctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2); cctx.fill();
      } else if (e.kind === "triangle") {
        cctx.fillStyle = e.fill; cctx.beginPath(); cctx.moveTo(e.x + e.w / 2, e.y); cctx.lineTo(e.x + e.w, e.y + e.h); cctx.lineTo(e.x, e.y + e.h); cctx.closePath(); cctx.fill();
      } else if (e.kind === "star") {
        cctx.fillStyle = e.fill;
        const cx2 = e.x + e.w / 2, cy2 = e.y + e.h / 2, r = Math.min(e.w, e.h) / 2;
        cctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const angle = -Math.PI / 2 + (i * Math.PI / 5);
          const rr = i % 2 === 0 ? r : r * 0.45;
          const px = cx2 + Math.cos(angle) * rr, py = cy2 + Math.sin(angle) * rr;
          if (i === 0) cctx.moveTo(px, py); else cctx.lineTo(px, py);
        }
        cctx.closePath(); cctx.fill();
      } else if (e.kind === "line") {
        cctx.strokeStyle = e.color; cctx.lineWidth = e.thickness; cctx.lineCap = "round";
        cctx.beginPath(); cctx.moveTo(e.x, e.y); cctx.lineTo(e.x + e.w, e.y + e.h); cctx.stroke();
      } else if (e.kind === "text") {
        cctx.fillStyle = e.color; cctx.font = `${e.fontWeight} ${e.fontSize}px '${e.fontFamily}', sans-serif`;
        cctx.textAlign = e.align || "left"; cctx.textBaseline = "top";
        const x = e.align === "center" ? e.x + e.w / 2 : e.align === "right" ? e.x + e.w : e.x;
        cctx.fillText(e.text, x, e.y, e.w);
      } else if (e.kind === "sticky") {
        cctx.fillStyle = e.fill; cctx.fillRect(e.x, e.y, e.w, e.h);
        cctx.fillStyle = e.color; cctx.font = `500 18px Inter, sans-serif`; cctx.textBaseline = "top";
        cctx.fillText(e.text, e.x + 10, e.y + 10, e.w - 20);
      } else if (e.kind === "image") {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image(); im.crossOrigin = "anonymous";
          im.onload = () => resolve(im); im.onerror = reject; im.src = e.src;
        }).catch(() => null as any);
        if (img) cctx.drawImage(img, e.x, e.y, e.w, e.h);
      } else if (e.kind === "table") {
        cctx.fillStyle = e.color; cctx.fillRect(e.x, e.y, e.w, e.h);
        cctx.strokeStyle = e.lineColor; cctx.lineWidth = 1;
        for (let r = 0; r <= e.rows; r++) { const y = e.y + (e.h / e.rows) * r; cctx.beginPath(); cctx.moveTo(e.x, y); cctx.lineTo(e.x + e.w, y); cctx.stroke(); }
        for (let c2 = 0; c2 <= e.cols; c2++) { const x = e.x + (e.w / e.cols) * c2; cctx.beginPath(); cctx.moveTo(x, e.y); cctx.lineTo(x, e.y + e.h); cctx.stroke(); }
      }
      cctx.restore();
      const bytes = await canvasToPngBytes(c);
      layers.push({ name: `${e.kind}-${e.id}`, canvas: c, imageData: cctx.getImageData(0, 0, STAGE_W, STAGE_H), opacity: 1, hidden: false });
    }
    const psd: Psd = { width: STAGE_W, height: STAGE_H, children: layers } as any;
    const buf = writePsd(psd);
    const blob = new Blob([buf], { type: "image/vnd.adobe.photoshop" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "rocket-canvas.psd"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const applyTemplate = (templateId: string) => {
    const t = TEMPLATES.find((x) => x.id === templateId); if (!t) return;
    setBg(t.bg); setEls(t.build()); clearSelection(); setShowTemplates(false);
  };

  const applyColorToSelected = (color: string) => {
    if (!selected) return;
    if (["text", "line", "sticky"].includes(selected.kind)) update(selected.id, { color } as any);
    if (["rect", "circle", "triangle", "star"].includes(selected.kind)) update(selected.id, { fill: color } as any);
    if (selected.kind === "table") update(selected.id, { lineColor: color } as any);
  };
  const applyFontToSelected = (fontFamily: string) => {
    if (!selected) return;
    if (selected.kind === "text") update(selected.id, { fontFamily } as any);
  };

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if (meta && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      if (meta && e.key.toLowerCase() === "d" && selectedId) { e.preventDefault(); duplicate(selectedId); }
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) { e.preventDefault(); remove(selectedId); }
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        const cur = els.find((x) => x.id === selectedId); if (!cur || cur.locked) return;
        update(selectedId, { x: cur.x + dx, y: cur.y + dy } as any);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [els, selectedId, undo, redo]);

  const commonNodeEvents = (el: El) => ({
    onClick: () => setSelectedId(el.id),
    onTap: () => setSelectedId(el.id),
    draggable: !el.locked,
    onDragEnd: (e: any) => update(el.id, { x: e.target.x(), y: e.target.y() } as any),
    onTransformEnd: (e: any) => {
      const n = e.target; const sx = n.scaleX(); const sy = n.scaleY();
      n.scaleX(1); n.scaleY(1);
      const patch: any = { x: n.x(), y: n.y(), rotation: n.rotation(), w: Math.max(8, n.width() * sx), h: Math.max(8, n.height() * sy) };
      if (el.kind === "line") patch.thickness = Math.max(1, el.thickness * sy);
      update(el.id, patch);
    },
  });

  const renderNode = (el: El) => {
    if (!el.visible) return null;
    const common = {
      ref: (n: any) => { nodeRefs.current[el.id] = n; },
      ...commonNodeEvents(el),
    };
    if (el.kind === "text") return (
      <KText key={el.id} {...common} x={el.x} y={el.y} width={el.w} height={el.h}
        text={el.text} fill={el.color} fontSize={el.fontSize} fontStyle={el.fontWeight >= 600 ? "bold" : "normal"}
        fontFamily={el.fontFamily} align={el.align || "left"} rotation={el.rotation || 0}
        onDblClick={() => setEditingTextId(el.id)} onDblTap={() => setEditingTextId(el.id)}
      />
    );
    if (el.kind === "rect") return <Rect key={el.id} {...common} x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} cornerRadius={el.radius} rotation={el.rotation || 0} />;
    if (el.kind === "circle") return <KCircle key={el.id} {...common} x={el.x + el.w / 2} y={el.y + el.h / 2} radius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={el.rotation || 0} />;
    if (el.kind === "triangle") return <RegularPolygon key={el.id} {...common} x={el.x + el.w / 2} y={el.y + el.h / 2} sides={3} radius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={el.rotation || 0} />;
    if (el.kind === "star") return <KStar key={el.id} {...common} x={el.x + el.w / 2} y={el.y + el.h / 2} numPoints={5} innerRadius={Math.min(el.w, el.h) / 5} outerRadius={Math.min(el.w, el.h) / 2} fill={el.fill} rotation={el.rotation || 0} />;
    if (el.kind === "line") return <KLine key={el.id} {...common} points={[el.x, el.y, el.x + el.w, el.y + el.h]} stroke={el.color} strokeWidth={el.thickness} lineCap="round" rotation={el.rotation || 0} />;
    if (el.kind === "image") return <KonvaImage key={el.id} el={el} {...common} />;
    if (el.kind === "sticky") return (
      <Group key={el.id} {...common} x={el.x} y={el.y} rotation={el.rotation || 0}>
        <Rect x={0} y={0} width={el.w} height={el.h} fill={el.fill} cornerRadius={10} shadowBlur={10} shadowOpacity={0.12} />
        <KText x={10} y={10} width={el.w - 20} height={el.h - 20} text={el.text} fill={el.color} fontSize={18} fontFamily="Inter"
          onDblClick={() => setEditingTextId(el.id)} onDblTap={() => setEditingTextId(el.id)} />
      </Group>
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
            <Link to={`/editor?id=${assetId}`} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
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