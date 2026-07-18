import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { supabase as _sb } from "@/integrations/supabase/client";
import {
  Stage, Layer, Rect, Circle as KCircle, Text as KText,
  Line as KLine, RegularPolygon, Star as KStar, Transformer, Group,
} from "react-konva";
import type Konva from "konva";
import KonvaImage from "@/components/KonvaImage";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2,
  Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Download, Save,
  Minus, StickyNote, Table as TableIcon, Triangle as TriangleIcon, Star as StarIcon,
  Undo2, Redo2, Copy, Keyboard, LayoutTemplate, Sparkles, Check, Loader2, Upload,
  History, FilePlus, Pencil, ChevronDown, Settings2, Grid3X3, Printer, FolderPlus,
  Maximize2, Minimize2, Paintbrush, ClipboardPaste,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuShortcut, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import type { AppShellOutletContext } from "@/components/AppShell";
import { defaultLogotypeState, LOGOTYPE_FONTS, pickLogotypeText, type LogotypeState, loadGoogleFont } from "@/lib/logotype";
import { isBrandAsset } from "@/lib/assetExperience";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
type ImgEl  = Base & { kind: "image"; src: string; color?: string };
type LineEl = Base & { kind: "line"; color: string; thickness: number };
type StickyEl = Base & { kind: "sticky"; text: string; fill: string; color: string };
type TriEl = Base & { kind: "triangle"; fill: string };
type StarEl = Base & { kind: "star"; fill: string };
type TableEl = Base & { kind: "table"; rows: number; cols: number; color: string; lineColor: string };
type El = TextEl | RectEl | CircEl | ImgEl | LineEl | StickyEl | TriEl | StarEl | TableEl;

const BASE_FONTS: string[] = [
  "Inter", "Arimo", "Montserrat", "Open Sans", "Poppins", "DM Sans",
  "Roboto", "Lato", "Oswald", "Raleway", "Nunito", "Work Sans",
  "Playfair Display", "Merriweather", "Lora", "Cormorant Garamond",
  "League Spartan", "Anton", "Archivo Black", "Bebas Neue", "Abril Fatface",
  "Pacifico", "Caveat", "Dancing Script", "Permanent Marker", "Shadows Into Light",
  "Space Grotesk", "JetBrains Mono", "IBM Plex Sans", "IBM Plex Serif",
  "Quicksand", "Karla", "Manrope", "Rubik", "Mulish", "Source Sans 3",
];
const DEFAULT_FONTS: string[] = Array.from(new Set([...BASE_FONTS, ...LOGOTYPE_FONTS.map((font) => font.family)]));
const GOOGLE_FONTS_API_KEY = "AIzaSyBDTmEcqcga0Mme3z8RGkbv6woncJYqHfw";
const GOOGLE_FONTS_CACHE_KEY = "rocket.editor.google-fonts.v1";
const FONT_DATALIST_ID = "rocket-editor-font-options";
const TEMPLATE_MENU_LABELS = [
  "Brand Guidelines",
  "Brand Templates",
  "Logos",
  "Colors",
  "Fonts",
  "Brand Voice",
  "Photos",
  "Components",
  "Graphics",
  "Icons",
  "Launch Copy",
  "PH Copy",
  "Social Post",
];

const uid = () => Math.random().toString(36).slice(2, 9);
const STORAGE_KEY = "rocket.editor.v2";
const STAGE_W = 800;
const STAGE_H = 600;

function applyTextTransform(text: string, transform?: LogotypeState["transform"]): string {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") return text.replace(/\b\w/g, (char) => char.toUpperCase());
  return text;
}

function logotypeStateToCanvasText(state: LogotypeState): TextEl {
  const text = applyTextTransform(state.text, state.transform);
  const compact = text.replace(/\s+/g, "");
  const fontSize = compact.length > 14 ? 72 : compact.length > 10 ? 84 : 96;
  return {
    id: uid(),
    kind: "text",
    x: 80,
    y: 250,
    w: 640,
    h: 120,
    visible: true,
    locked: false,
    text,
    color: state.color || "#0A0A0A",
    fontSize,
    fontWeight: state.weight || 700,
    fontFamily: state.font || "Space Grotesk",
    align: "center",
  };
}

function deriveLogotypeState(asset: any): LogotypeState | null {
  if (asset?.editor_state?.kind === "logotype") {
    return asset.editor_state as LogotypeState;
  }
  if (asset?.asset_type !== "logo" || asset?.image_url) return null;
  const brandContext = asset?.meta?.brand_context || {};
  const text = pickLogotypeText({
    prompt: asset?.prompt,
    productName: brandContext?.productName,
    url: brandContext?.url || asset?.source_url,
    fallback: asset?.title,
  });
  if (!text) return null;
  return defaultLogotypeState(text, brandContext?.colors?.[0] || "#0A0A0A");
}

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

/* --------------------------------- Editor --------------------------------- */
const Editor = () => {
  const { toast } = useToast();
  const nav = useNavigate();
  const { setHeaderCenter, setHeaderActions } = useOutletContext<AppShellOutletContext>();
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  const assetId = params.get("id");
  const [assetMeta, setAssetMeta] = useState<{ title: string; project_id: string | null; asset_type?: string | null; image_url?: string | null; meta?: Record<string, unknown> } | null>(null);
  const [brandKit, setBrandKit] = useState<{ colors: string[]; fonts: string[]; logos: { id: string; url: string; title: string }[] }>({ colors: [], fonts: [], logos: [] });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showGrid, setShowGrid] = useState(false);
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [fontFamilies, setFontFamilies] = useState<string[]>(DEFAULT_FONTS);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const editorShellRef = useRef<HTMLDivElement>(null);
  const copiedElementRef = useRef<El | null>(null);
  const copiedStyleRef = useRef<Partial<El> | null>(null);
  const [clipboardTick, setClipboardTick] = useState(0);

  useEffect(() => {
    setHasDownloaded(false);
  }, [assetId]);

  /* fonts */
  useEffect(() => {
    if (document.getElementById("rocket-editor-fonts")) return;
    const families = DEFAULT_FONTS.map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`).join("&");
    const link = document.createElement("link");
    link.id = "rocket-editor-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let alive = true;
    try {
      const cached = localStorage.getItem(GOOGLE_FONTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          setFontFamilies((prev) => Array.from(new Set([...prev, ...parsed])));
        }
      }
    } catch {}
    (async () => {
      try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=alpha`);
        if (!response.ok) return;
        const data = await response.json();
        const fetched = Array.isArray(data?.items) ? data.items.map((item: any) => item?.family).filter(Boolean) : [];
        if (!alive || !fetched.length) return;
        setFontFamilies((prev) => Array.from(new Set([...prev, ...fetched])));
        try { localStorage.setItem(GOOGLE_FONTS_CACHE_KEY, JSON.stringify(fetched)); } catch {}
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  /* state + history */
  const [els, _setEls] = useState<El[]>(() => {
    // If we're opening a specific asset, start empty and wait for the fetch to
    // hydrate. Otherwise flash previously-edited design from localStorage.
    try {
      const hasAssetId = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("id");
      if (hasAssetId) return [];
      const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [bg, setBg] = useState<string>(() => {
    try { return localStorage.getItem("rocket.editor.bg.v1") || "#ffffff"; } catch { return "#ffffff"; }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [extraSelectedIds, setExtraSelectedIds] = useState<Set<string>>(new Set());
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectOnly = useCallback((id: string) => {
    setSelectedId(id);
    setExtraSelectedIds(new Set());
  }, []);
  const toggleExtra = useCallback((id: string) => {
    setExtraSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const allSelectedIds = useMemo(() => {
    const set = new Set<string>(extraSelectedIds);
    if (selectedId) set.add(selectedId);
    return Array.from(set);
  }, [selectedId, extraSelectedIds]);
  const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(null);
  const [autosaveTick, setAutosaveTick] = useState(0);
  const skipAutosaveRef = useRef(false);
  const lastPersistedStateRef = useRef<string>("[]");
  const history = useRef<{ past: El[][]; future: El[][] }>({ past: [], future: [] });

  useEffect(() => {
    if (!canvasMenu) return;
    const close = () => setCanvasMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [canvasMenu]);

  const setEls = useCallback((updater: El[] | ((prev: El[]) => El[]), opts?: { history?: boolean; autosave?: boolean }) => {
    _setEls((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      if (opts?.history !== false) {
        history.current.past.push(prev);
        if (history.current.past.length > 50) history.current.past.shift();
        history.current.future = [];
      }
      return next;
    });
    if (opts?.autosave !== false) {
      setAutosaveTick((tick) => tick + 1);
    }
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

  const openCanvasMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCanvasMenu({ x: event.clientX, y: event.clientY });
  }, []);

  /* load asset */
  useEffect(() => {
    if (!assetId) return;
    (async () => {
      skipAutosaveRef.current = true;
      setAutosaveTick(0);
      const { data: a } = await supabase.from("assets").select("*").eq("id", assetId).maybeSingle();
      if (!a) return;
      // If this asset belongs in the Brand workspace (text/strategy), redirect there.
      if (isBrandAsset(a)) {
        const pid = a.project_id ? `/${a.project_id}` : "";
        nav(`/brands${pid}?asset=${a.id}`, { replace: true });
        return;
      }
      setAssetMeta({ title: a.title || "Untitled", project_id: a.project_id || null, asset_type: a.asset_type || null, image_url: a.image_url || null, meta: a.meta || {} });
      if (a.editor_state && Array.isArray(a.editor_state)) {
        lastPersistedStateRef.current = JSON.stringify(a.editor_state);
        _setEls(a.editor_state); return;
      }
      const logotypeState = deriveLogotypeState(a);
      if (logotypeState) {
        const next = [logotypeStateToCanvasText(logotypeState)];
        lastPersistedStateRef.current = JSON.stringify(next);
        _setEls(next); return;
      }
      if (a.image_url) {
        // Probe natural size so we preserve the photo's real aspect ratio.
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth || 500, h: img.naturalHeight || 400 });
          img.onerror = () => resolve({ w: 500, h: 400 });
          img.src = a.image_url as string;
        });
        const pad = 60;
        const maxW = STAGE_W - pad * 2;
        const maxH = STAGE_H - pad * 2;
        const ratio = dims.w / dims.h;
        let w = maxW, h = maxW / ratio;
        if (h > maxH) { h = maxH; w = maxH * ratio; }
        const x = (STAGE_W - w) / 2;
        const y = (STAGE_H - h) / 2;
        const next = [{ id: uid(), kind: "image", x, y, w, h, visible: true, locked: false, src: a.image_url } as ImgEl];
        lastPersistedStateRef.current = JSON.stringify(next);
        _setEls(next);
      } else if (a.content) {
        const next = [{
          id: uid(), kind: "text", x: 80, y: 200, w: 640, h: 280,
          visible: true, locked: false,
          text: String(a.content).slice(0, 800),
          color: "#0A0A0A", fontSize: 32, fontWeight: 600, fontFamily: "Inter",
        } as TextEl];
        lastPersistedStateRef.current = JSON.stringify(next);
        _setEls(next);
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
            for (const f of fontFamilies) if (text.includes(f)) fonts.add(f);
          }
        }
      }
      setBrandKit({ colors: Array.from(colors).slice(0, 24), fonts: Array.from(fonts).slice(0, 12), logos });
    })();
  }, [assetMeta?.project_id, fontFamilies]);

  /* persist */
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(els)); } catch {}
  }, [els]);
  useEffect(() => {
    try { localStorage.setItem("rocket.editor.bg.v1", bg); } catch {}
  }, [bg]);

  const selected = els.find((e) => e.id === selectedId) || null;
  const displayTitle = assetMeta?.title?.trim() || "Untitled design";
  const canPaste = useMemo(() => Boolean(copiedElementRef.current || copiedStyleRef.current), [clipboardTick]);

  const withSelectionHidden = useCallback(async <T,>(work: () => T | Promise<T>) => {
    const prevSelectedId = selectedId;
    setSelectedId(null);
    await new Promise((resolve) => setTimeout(resolve, 40));
    try {
      return await work();
    } finally {
      setSelectedId(prevSelectedId);
    }
  }, [selectedId]);

  const toggleFullscreen = useCallback(async () => {
    const target = editorShellRef.current;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (target?.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch {}
  }, []);

  const captureThumbnail = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return null;
    return withSelectionHidden(async () => {
      try {
        return stage.toDataURL({ pixelRatio: 0.5, mimeType: "image/png" });
      } catch {
        return null;
      }
    });
  }, [withSelectionHidden]);

  const updateLifecycleMeta = useCallback(async (updates: Record<string, string>) => {
    if (!assetId) return;
    const meta = { ...(assetMeta?.meta || {}), ...updates };
    setAssetMeta((current) => current ? { ...current, meta } : current);
    const { error } = await supabase.from("assets").update({ meta }).eq("id", assetId);
    if (error) console.error("Could not update design lifecycle", error);
  }, [assetId, assetMeta?.meta]);

  /* auto-save to asset (debounced) */
  useEffect(() => {
    if (!assetId || autosaveTick === 0) return;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    const serializedState = JSON.stringify(els);
    if (serializedState === lastPersistedStateRef.current) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const thumbnail_url = assetMeta?.image_url ? null : await captureThumbnail();
      const nextMeta = { ...(assetMeta?.meta || {}), edited_at: new Date().toISOString() };
      const updatePayload: Record<string, unknown> = { editor_state: els as any, meta: nextMeta };
      if (thumbnail_url) updatePayload.thumbnail_url = thumbnail_url;
      const { error } = await supabase.from("assets").update(updatePayload).eq("id", assetId);
      if (error) { setSaveStatus("idle"); return; }
      setAssetMeta((current) => current ? { ...current, meta: nextMeta } : current);
      lastPersistedStateRef.current = serializedState;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => s === "saved" ? "idle" : s), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [assetId, assetMeta?.image_url, assetMeta?.meta, autosaveTick, captureThumbnail, els]);

  useEffect(() => {
    if (!isRenamingTitle) setTitleDraft(displayTitle);
  }, [displayTitle, isRenamingTitle]);

  useEffect(() => {
    if (!isRenamingTitle) return;
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [isRenamingTitle]);

  const persistTitle = useCallback(async (nextTitleRaw: string) => {
    const nextTitle = nextTitleRaw.trim() || "Untitled design";
    const previousTitle = assetMeta?.title?.trim() || "Untitled design";

    setIsRenamingTitle(false);
    setTitleDraft(nextTitle);

    if (nextTitle === previousTitle && assetMeta) return;

    setAssetMeta((prev) => prev ? { ...prev, title: nextTitle } : prev);
    if (!assetId) return;

    setSaveStatus("saving");
    const { error } = await supabase.from("assets").update({ title: nextTitle }).eq("id", assetId);
    if (error) {
      setAssetMeta((prev) => prev ? { ...prev, title: previousTitle } : prev);
      setTitleDraft(previousTitle);
      setSaveStatus("idle");
      toast({ title: "Rename failed", description: error.message, variant: "destructive" });
      return;
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
  }, [assetId, assetMeta, toast]);

  useEffect(() => {
    setHeaderCenter(
      <div className="mx-auto flex items-center justify-center gap-2">
        {isRenamingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { void persistTitle(titleDraft); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void persistTitle(titleDraft);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setTitleDraft(displayTitle);
                setIsRenamingTitle(false);
              }
            }}
            className="h-10 w-full rounded-full border border-neutral-200 bg-white px-4 text-center text-sm font-semibold text-neutral-900 outline-none ring-0 transition focus:border-neutral-300 focus:bg-neutral-50"
            aria-label="Design name"
            placeholder="Untitled design"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsRenamingTitle(true)}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-200 hover:bg-neutral-50"
            aria-label="Rename design"
          >
            <span className="truncate">{displayTitle}</span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          </button>
        )}
      </div>
    );
    return () => setHeaderCenter(null);
  }, [displayTitle, isRenamingTitle, persistTitle, setHeaderCenter, titleDraft]);

  const fetchProjectsForMenu = useCallback(async () => {
    if (!assetId) return;
    setLoadingProjects(true);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      setProjectOptions([]);
      setLoadingProjects(false);
      return;
    }
    const { data } = await supabase
      .from("projects")
      .select("id,name")
      .eq("user_id", uid)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);
    setProjectOptions((data || []) as { id: string; name: string }[]);
    setLoadingProjects(false);
  }, [assetId]);

  const assignProject = useCallback(async (projectId: string | null) => {
    if (!assetId) return;
    const { error } = await supabase.from("assets").update({ project_id: projectId }).eq("id", assetId);
    if (error) {
      toast({ title: "Move failed", description: error.message, variant: "destructive" });
      return;
    }
    setAssetMeta((prev) => (prev ? { ...prev, project_id: projectId } : prev));
    toast({ title: projectId ? "Moved design to project" : "Removed design from project" });
  }, [assetId, toast]);

  const createProjectAndAssign = useCallback(async () => {
    if (!assetId) return;
    const name = window.prompt("New project name");
    if (!name?.trim()) return;
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: uid, name: name.trim() })
      .select("id,name")
      .single();
    if (error || !data) {
      toast({ title: "Project creation failed", description: error?.message, variant: "destructive" });
      return;
    }
    setProjectOptions((prev) => [data as { id: string; name: string }, ...prev]);
    await assignProject(data.id);
  }, [assetId, assignProject, toast]);

  const startNewDesign = useCallback(() => {
    history.current = { past: [], future: [] };
    setSelectedId(null);
    setAssetMeta(null);
    _setEls([]);
    setBg("#ffffff");
    setAutosaveTick(0);
    lastPersistedStateRef.current = "[]";
    nav("/editor");
  }, [nav]);

  const printCanvas = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = await withSelectionHidden(() => stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" }));
    const win = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
    if (!win) {
      toast({ title: "Popup blocked", description: "Allow popups to print this design.", variant: "destructive" });
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>${displayTitle}</title>
          <style>
            body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: white; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="${displayTitle}" />
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }, [displayTitle, toast, withSelectionHidden]);

  const moveToTrash = useCallback(async () => {
    if (!assetId) {
      if (!els.length && bg === "#ffffff") {
        toast({ title: "Nothing to move", description: "This blank draft has no design content yet." });
        return;
      }
      if (!window.confirm("Discard this unsaved draft? Unsaved drafts cannot be restored from Trash.")) return;
      history.current = { past: [], future: [] };
      setSelectedId(null);
      setAssetMeta(null);
      _setEls([]);
      setBg("#ffffff");
      setAutosaveTick(0);
      lastPersistedStateRef.current = "[]";
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("rocket.editor.bg.v1");
      } catch {}
      toast({ title: "Draft discarded", description: "Your unsaved design draft was cleared." });
      nav("/designs");
      return;
    }
    if (!window.confirm("Move this design to Trash? Restore anytime from /trash.")) return;
    const { error } = await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", assetId);
    if (error) {
      toast({ title: "Trash failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Moved to Trash", description: "You can restore it from Trash anytime." });
    nav("/designs");
  }, [assetId, bg, els.length, nav, toast]);

  /* attach transformer */
  useEffect(() => {
    const tr = trRef.current; if (!tr) return;
    const nodes = allSelectedIds
      .map((id) => {
        const el = els.find((e) => e.id === id);
        if (!el || el.locked) return null;
        return nodeRefs.current[id] || null;
      })
      .filter(Boolean) as any[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [allSelectedIds, els, selected]);

  const update = (id: string, patch: Partial<El>, opts?: { history?: boolean }) =>
    setEls((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as El) : e)), opts);
  const remove = (id: string) => { setEls((p) => p.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); };
  const duplicate = (id: string) => {
    const e = els.find((x) => x.id === id); if (!e) return;
    const copy = { ...e, id: uid(), x: e.x + 20, y: e.y + 20 } as El;
    setEls((p) => [...p, copy]); setSelectedId(copy.id);
  };
  const copySelectedElement = () => {
    if (!selected) return;
    copiedElementRef.current = JSON.parse(JSON.stringify(selected));
    copiedStyleRef.current = null;
    setClipboardTick((tick) => tick + 1);
  };
  const copySelectedStyle = () => {
    if (!selected) return;
    const style: Record<string, any> = selected.kind === "text"
      ? {
          color: selected.color,
          fontFamily: selected.fontFamily,
          fontSize: selected.fontSize,
          fontWeight: selected.fontWeight,
          align: selected.align,
        }
      : selected.kind === "sticky"
        ? { fill: selected.fill, color: selected.color }
        : selected.kind === "rect"
          ? { fill: selected.fill, radius: selected.radius }
          : selected.kind === "circle" || selected.kind === "triangle" || selected.kind === "star"
            ? { fill: (selected as any).fill }
            : selected.kind === "line"
              ? { color: selected.color, thickness: selected.thickness }
              : null;
    if (!style) return;
    copiedStyleRef.current = style as Partial<El>;
    copiedElementRef.current = null;
    setClipboardTick((tick) => tick + 1);
  };
  const pasteClipboard = () => {
    const copied = copiedElementRef.current;
    if (copied) {
      const next = { ...JSON.parse(JSON.stringify(copied)), id: uid(), x: copied.x + 20, y: copied.y + 20 } as El;
      setEls((prev) => [...prev, next]);
      setSelectedId(next.id);
      return;
    }
    const style = copiedStyleRef.current as any;
    if (style && selected) {
      if (selected.kind === "text") {
        update(selected.id, {
          color: style.color ?? (selected as TextEl).color,
          fontFamily: style.fontFamily ?? (selected as TextEl).fontFamily,
          fontSize: style.fontSize ?? (selected as TextEl).fontSize,
          fontWeight: style.fontWeight ?? (selected as TextEl).fontWeight,
          align: style.align ?? (selected as TextEl).align,
        } as any);
      } else if (selected.kind === "sticky") {
        update(selected.id, {
          fill: style.fill ?? (selected as StickyEl).fill,
          color: style.color ?? (selected as StickyEl).color,
        } as any);
      } else if (selected.kind === "rect") {
        update(selected.id, {
          fill: style.fill ?? (selected as RectEl).fill,
          radius: style.radius ?? (selected as RectEl).radius,
        } as any);
      } else if (selected.kind === "circle" || selected.kind === "triangle" || selected.kind === "star") {
        update(selected.id, { fill: style.fill ?? (selected as any).fill } as any);
      } else if (selected.kind === "line") {
        update(selected.id, {
          color: style.color ?? (selected as LineEl).color,
          thickness: style.thickness ?? (selected as LineEl).thickness,
        } as any);
      }
    }
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
    reader.onload = async () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = Math.min(400, img.width); const h = w / ratio;
        add({ id: uid(), kind: "image", x: 300, y: 200, w, h, visible: true, locked: false, src } as ImgEl);
      };
      img.src = src;
      // Mirror into Uploads on /projects so users can reuse it
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid2 = userData?.user?.id;
        if (!uid2) return;
        const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
        const workspace_id = await ensureActiveWorkspaceId();
        const { data: uploadRow } = await supabase.from("assets").insert({
          user_id: uid2,
          workspace_id,
          asset_type: "photo",
          title: file.name || "Uploaded image",
          image_url: src,
          thumbnail_url: src,
          meta: { uploaded: true, source: "upload", size: file.size, mime: file.type } as any,
        } as any).select("id").maybeSingle();
        window.dispatchEvent(new CustomEvent("rocket:notify", { detail: {
          kind: "asset",
          title: "Image uploaded",
          body: `"${file.name || "Uploaded image"}" is now in your Uploads.`,
          href: uploadRow?.id ? `/editor?id=${uploadRow.id}` : "/projects",
        }}));
      } catch (e) {
        console.warn("upload mirror failed", e);
      }
    };
    reader.readAsDataURL(file);
  };

  /* save / export */
  const save = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(els));
    setSaveStatus("saving");
    if (assetId) {
      const serializedState = JSON.stringify(els);
      const thumbnail_url = assetMeta?.image_url ? null : await captureThumbnail();
      const nextMeta = { ...(assetMeta?.meta || {}), edited_at: new Date().toISOString() };
      const updatePayload: Record<string, unknown> = { editor_state: els as any, meta: nextMeta };
      if (thumbnail_url) updatePayload.thumbnail_url = thumbnail_url;
      const { error } = await supabase.from("assets").update(updatePayload).eq("id", assetId);
      if (error) { setSaveStatus("idle"); toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
      setAssetMeta((current) => current ? { ...current, meta: nextMeta } : current);
      lastPersistedStateRef.current = serializedState;
    }
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    toast({ title: "Saved", description: assetId ? "Design saved." : "Design saved locally." });
  };

  const saveVersion = async () => {
    if (!assetId) { toast({ title: "Open this saved design to keep versions.", variant: "destructive" }); return; }
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
    if (!uid2) { toast({ title: "Sign in to save designs", variant: "destructive" }); return; }
    const title = prompt("Name for the new design:", assetMeta?.title ? `${assetMeta.title} (copy)` : "Untitled design") || "Untitled design";
    const thumb = await captureThumbnail();
    const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
    const workspace_id = await ensureActiveWorkspaceId();
    const { data, error } = await supabase.from("assets").insert({
      user_id: uid2,
      workspace_id,
      project_id: assetMeta?.project_id || null,
      asset_type: "other",
      title,
      editor_state: els as any,
      thumbnail_url: thumb,
    } as any).select().single();
    if (error || !data) { toast({ title: "Failed", description: error?.message, variant: "destructive" }); return; }
    toast({ title: "Saved as new design" });
    window.dispatchEvent(new CustomEvent("rocket:notify", { detail: {
      kind: "asset",
      title: "New design saved",
      body: `"${title}" was added to your designs.`,
      href: `/editor?id=${data.id}`,
    }}));
    nav(`/editor?id=${data.id}`);
  };

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id); if (!t) return;
    setBg(t.bg);
    setEls(t.build());
    setSelectedId(null);
  };

  const addImageFromUrl = (src: string) => {
    add({ id: uid(), kind: "image", x: 240, y: 180, w: 320, h: 240, visible: true, locked: false, src } as ImgEl);
  };

  const applyColorToSelected = (color: string) => {
    if (!selected) return;
    if (selected.kind === "text" || selected.kind === "sticky") update(selected.id, { color } as any);
    else if (selected.kind === "rect" || selected.kind === "circle" || selected.kind === "triangle" || selected.kind === "star") update(selected.id, { fill: color } as any);
    else if (selected.kind === "line") update(selected.id, { color } as any);
    else if (selected.kind === "image") update(selected.id, { color } as any);
    else setBg(color);
  };

  const applyFontToSelected = (fontFamily: string) => {
    void loadGoogleFont(fontFamily, [400, 500, 600, 700, 800]);
    if (selected?.kind === "text") update(selected.id, { fontFamily } as any);
  };

  const exportImage = (type: "png" | "jpeg" = "png") => {
    const stage = stageRef.current; if (!stage) return;
    const prev = selectedId; setSelectedId(null);
    setTimeout(() => {
      try {
        const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: `image/${type}`, quality: 0.95 });
        const a = document.createElement("a"); a.href = dataUrl; a.download = `rocket-design.${type}`; a.click();
        setHasDownloaded(true);
        void updateLifecycleMeta({ downloaded_at: new Date().toISOString() });
        toast({
          title: `${type === "png" ? "PNG" : "JPG"} downloaded`,
          description: assetId ? "Next, use it as the style for your brand or keep editing." : "Your design is ready to use.",
        });
      } catch (e: any) {
        toast({ title: "Export failed", description: e?.message || "Unknown error", variant: "destructive" });
      }
      setSelectedId(prev);
    }, 50);
  };

  const isLogoDesign = ["logo", "logotype", "wordmark"].includes(String(assetMeta?.asset_type || "").toLowerCase());

  const setAsBrandStyle = async () => {
    if (!assetId) {
      toast({ title: "Save this design first", description: "Saved designs can become your brand style." });
      return;
    }
    let projectId = assetMeta?.project_id || null;
    const { data: current, error: currentError } = await supabase
      .from("assets")
      .select("id,meta,project_id,user_id,title,asset_type")
      .eq("id", assetId)
      .maybeSingle();
    if (currentError || !current) {
      toast({ title: "Could not set brand style", description: currentError?.message, variant: "destructive" });
      return;
    }
    if (!projectId) {
      const suggestedName = String(current.meta?.brand_context?.productName || current.title || "My brand").trim() || "My brand";
      const name = window.prompt("Name your brand", suggestedName);
      if (!name?.trim()) return;
      const { ensureActiveWorkspaceId } = await import("@/lib/workspace");
      const workspace_id = await ensureActiveWorkspaceId();
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: current.user_id,
          workspace_id,
          name: name.trim(),
        } as any)
        .select("id")
        .maybeSingle();
      if (projectError || !project?.id) {
        toast({ title: "Could not create brand", description: projectError?.message, variant: "destructive" });
        return;
      }
      projectId = project.id;
      const { error: assignError } = await supabase.from("assets").update({ project_id: projectId }).eq("id", assetId);
      if (assignError) {
        toast({ title: "Could not add design to brand", description: assignError.message, variant: "destructive" });
        return;
      }
    }
    if (!projectId) return;
    let existingQuery = supabase.from("assets").select("id,meta").eq("user_id", (await supabase.auth.getUser()).data?.user?.id);
    existingQuery = existingQuery.eq("project_id", projectId);
    const { data: existing } = await existingQuery.limit(100);
    await Promise.all((existing || [])
      .filter((design: any) => design.id !== assetId && design.meta?.selected_as_direction)
      .map((design: any) => supabase.from("assets").update({
        meta: {
          ...(design.meta || {}),
          selected_as_direction: false,
          ...(design.meta?.brand_role === "primary_logo" ? { brand_role: null } : {}),
        },
      }).eq("id", design.id)));
    const nextMeta = {
      ...(current.meta || {}),
      selected_as_direction: true,
      selected_as_direction_at: new Date().toISOString(),
      direction_feedback: "kept",
      ...(isLogoDesign ? { brand_role: "primary_logo" } : {}),
    };
    const { error } = await supabase.from("assets").update({ meta: nextMeta, project_id: projectId }).eq("id", assetId);
    if (error) {
      toast({ title: "Could not set brand style", description: error.message, variant: "destructive" });
      return;
    }
    setAssetMeta((prev) => (prev ? { ...prev, project_id: projectId, meta: nextMeta } : prev));
    toast({
      title: isLogoDesign ? "Logo kept as your brand" : "Brand style set",
      description: isLogoDesign ? "Next: choose colours, typography, voice and guidelines." : "Future designs can now follow this direction.",
    });
    const query = new URLSearchParams({ direction: assetId, project: projectId });
    nav(`/brands?${query.toString()}`);
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
    const defs: string[] = [];
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
        if (el.color) {
          defs.push(`<clipPath id="clip-${el.id}"><image x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" href="${escapeXml(el.src)}" preserveAspectRatio="none"/></clipPath>`);
          parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.color}" clip-path="url(#clip-${el.id})"${transform}/>`);
        } else {
          parts.push(`<image x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" href="${escapeXml(el.src)}" preserveAspectRatio="none"${transform}/>`);
        }
      } else if (el.kind === "table") {
        parts.push(`<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.color}" stroke="${el.lineColor}"${transform}/>`);
        const cw = el.w / el.cols, rh = el.h / el.rows;
        for (let i = 1; i < el.cols; i++)
          parts.push(`<line x1="${el.x + cw * i}" y1="${el.y}" x2="${el.x + cw * i}" y2="${el.y + el.h}" stroke="${el.lineColor}"${transform}/>`);
        for (let i = 1; i < el.rows; i++)
          parts.push(`<line x1="${el.x}" y1="${el.y + rh * i}" x2="${el.x + el.w}" y2="${el.y + rh * i}" stroke="${el.lineColor}"${transform}/>`);
      }
    }
    const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${STAGE_W}" height="${STAGE_H}" viewBox="0 0 ${STAGE_W} ${STAGE_H}">`;
    const bgRect = `<rect width="${STAGE_W}" height="${STAGE_H}" fill="${bg}"/>`;
    const defBlock = defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "";
    return [svgOpen, defBlock, bgRect, ...parts, "</svg>"].join("");
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

  useEffect(() => {
    setHeaderActions(
      <DropdownMenu onOpenChange={(open) => { if (open) void fetchProjectsForMenu(); }}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 md:inline-flex"
          >
            File
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem onClick={startNewDesign}>
            <FilePlus className="mr-2 h-4 w-4" />
            Create new design
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload files
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings2 className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={(checked) => setShowGrid(!!checked)}>
                <Grid3X3 className="mr-2 h-4 w-4" />
                Show guides
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav("/settings/profile")}>
                <Settings2 className="mr-2 h-4 w-4" />
                Open settings
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={undo}>
            <Undo2 className="mr-2 h-4 w-4" />
            Undo
            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={redo}>
            <Redo2 className="mr-2 h-4 w-4" />
            Redo
            <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Save
            {assetId && saveStatus !== "idle" && (
              <DropdownMenuShortcut>{saveStatus === "saved" ? "Saved" : "Saving…"}</DropdownMenuShortcut>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={saveAsNew}>
            <Copy className="mr-2 h-4 w-4" />
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={saveVersion} disabled={!assetId}>
            <History className="mr-2 h-4 w-4" />
            Save version
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!assetId}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuItem onClick={() => void createProjectAndAssign()}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New project…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {loadingProjects ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading projects…
                </DropdownMenuItem>
              ) : projectOptions.length > 0 ? (
                projectOptions.map((project) => (
                  <DropdownMenuItem key={project.id} onClick={() => void assignProject(project.id)}>
                    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                      {project.id === assetMeta?.project_id ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
              )}
              {assetMeta?.project_id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void assignProject(null)}>
                    Remove from project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuItem onClick={() => exportImage("png")}>PNG image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportImage("jpeg")}>JPG image</DropdownMenuItem>
              <DropdownMenuItem onClick={exportPsd}>Photoshop (.psd)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSvg("Figma")}>Figma (SVG)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSvg("Sketch")}>Sketch (SVG)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSvg("Canva")}>Canva (SVG)</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => void printCanvas()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => nav("/trash")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Open Trash
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void moveToTrash()} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    return () => setHeaderActions(null);
  }, [
    assetId,
    assetMeta?.project_id,
    applyTemplate,
    assignProject,
    createProjectAndAssign,
    exportPsd,
    exportSvg,
    fetchProjectsForMenu,
    loadingProjects,
    moveToTrash,
    nav,
    printCanvas,
    projectOptions,
    redo,
    save,
    saveAsNew,
    saveStatus,
    saveVersion,
    setHeaderActions,
    showGrid,
    startNewDesign,
    undo,
  ]);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
      if (meta && e.key.toLowerCase() === "c" && e.shiftKey) { e.preventDefault(); copySelectedStyle(); return; }
      if (meta && e.key.toLowerCase() === "c") { e.preventDefault(); copySelectedElement(); return; }
      if (meta && e.key.toLowerCase() === "v") { e.preventDefault(); pasteClipboard(); return; }
      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); if (selectedId) duplicate(selectedId); return; }
      if (allSelectedIds.length === 0) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const ids = new Set(allSelectedIds);
        setEls((p) => p.filter((el) => !ids.has(el.id)));
        setSelectedId(null);
        setExtraSelectedIds(new Set());
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (dx || dy) {
        e.preventDefault();
        const ids = new Set(allSelectedIds);
        setEls((p) => p.map((el) => ids.has(el.id) ? ({ ...el, x: el.x + dx, y: el.y + dy } as El) : el));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allSelectedIds, copySelectedElement, copySelectedStyle, duplicate, pasteClipboard, redo, selected, selectedId, undo]);

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
      onClick: (e: any) => {
        const shift = e?.evt?.shiftKey;
        if (shift) {
          if (selectedId && selectedId !== el.id) toggleExtra(el.id);
          else selectOnly(el.id);
        } else {
          selectOnly(el.id);
        }
      },
      onTap: (e: any) => {
        const shift = e?.evt?.shiftKey;
        if (shift) {
          if (selectedId && selectedId !== el.id) toggleExtra(el.id);
          else selectOnly(el.id);
        } else {
          selectOnly(el.id);
        }
      },
      onContextMenu: (e: any) => {
        if (!allSelectedIds.includes(el.id)) selectOnly(el.id);
        openCanvasMenu(e.evt);
      },
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

  const CanvasContextMenu = () => {
    if (!canvasMenu) return null;
    const MenuButton = ({
      children,
      disabled,
      danger,
      onClick,
      shortcut,
    }: {
      children: ReactNode;
      disabled?: boolean;
      danger?: boolean;
      onClick: () => void;
      shortcut: string;
    }) => (
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          onClick();
          setCanvasMenu(null);
        }}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-neutral-800 hover:bg-neutral-100"
        } disabled:pointer-events-none disabled:text-neutral-400`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-500">{shortcut}</span>
      </button>
    );

    return (
      <div
        className="fixed z-[100] w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl"
        style={{ left: canvasMenu.x, top: canvasMenu.y }}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
      >
        <MenuButton onClick={copySelectedElement} disabled={!selected} shortcut="⌘C">
          <Copy className="h-4 w-4" />
          Copy
        </MenuButton>
        <MenuButton onClick={copySelectedStyle} disabled={!selected} shortcut="⇧⌘C">
          <Paintbrush className="h-4 w-4" />
          Copy style
        </MenuButton>
        <MenuButton onClick={pasteClipboard} disabled={!canPaste} shortcut="⌘V">
          <ClipboardPaste className="h-4 w-4" />
          Paste
        </MenuButton>
        <div className="my-1 h-px bg-neutral-200" />
        <MenuButton onClick={() => selected && duplicate(selected.id)} disabled={!selected} shortcut="⌘D">
          <Copy className="h-4 w-4" />
          Duplicate
        </MenuButton>
        <MenuButton onClick={() => selected && remove(selected.id)} disabled={!selected} danger shortcut="DELETE">
          <Trash2 className="h-4 w-4" />
          Delete
        </MenuButton>
      </div>
    );
  };

  return (
    <div ref={editorShellRef} className="relative flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-neutral-100">
      {/* Mobile warning */}
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-8 text-center md:hidden">
        <LayoutTemplate className="mb-3 h-8 w-8 text-neutral-400" />
        <p className="text-sm font-medium text-neutral-900">Editor is desktop-only</p>
        <p className="mt-1 text-xs text-neutral-500">Open Rocket on a larger screen to design.</p>
      </div>
      <div className="relative flex min-w-0 flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Top pill */}
      <aside className="pointer-events-auto mx-auto mt-4 hidden w-fit max-w-[calc(100%-2rem)] flex-nowrap items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-white/80 bg-white/88 px-2 py-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl md:flex">
        <ToolBtn onClick={addText} label="Text"><Type className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addRect} label="Rectangle"><Square className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addCircle} label="Circle"><CircleIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addTriangle} label="Triangle"><TriangleIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addStar} label="Star"><StarIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addLine} label="Line"><Minus className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addSticky} label="Sticky note"><StickyNote className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={addTable} label="Table"><TableIcon className="h-4 w-4" /></ToolBtn>
        <ToolBtn onClick={() => fileRef.current?.click()} label="Upload image"><ImageIcon className="h-4 w-4" /></ToolBtn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />

        <span className="mx-1 h-6 w-px bg-neutral-200" />
        <div className="flex items-center gap-1 rounded-full bg-neutral-100/70 p-0.5">
          <ToolBtn onClick={undo} label="Undo"><Undo2 className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={redo} label="Redo"><Redo2 className="h-4 w-4" /></ToolBtn>
        </div>

        <span className="mx-1 h-6 w-px bg-neutral-200" />

        <ColorPickerButton
          value={selected && (selected as any).fill ? (selected as any).fill : selected && (selected as any).color ? (selected as any).color : bg}
          onChange={applyColorToSelected}
          swatches={brandKit.colors}
        />

        {(brandKit.fonts.length + brandKit.colors.length) > 0 && (
          <>
            <span className="mx-1 h-6 w-px bg-neutral-200" />
            {brandKit.colors.slice(0, 3).map((c) => (
              <button key={c} onClick={() => applyColorToSelected(c)} title={`Color overlay: ${c}`}
                className="h-8 w-8 rounded-lg border border-neutral-200 hover:border-brand"
                style={{ background: c }} />
            ))}
            {brandKit.fonts.slice(0, 2).map((f) => (
              <button key={f} onClick={() => applyFontToSelected(f)} title={`Font: ${f}`}
                className="grid h-8 min-w-8 place-items-center rounded-xl border border-neutral-200/90 bg-white/75 px-2 text-[13px] text-neutral-700 hover:border-neutral-300"
                style={{ fontFamily: `'${f}', sans-serif` }}>Aa</button>
            ))}
          </>
        )}
      </aside>

      {/* Center */}
      <main className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain px-8 pb-28 pt-4">
          <div
            className="flex min-h-full min-w-full items-center justify-center py-10"
            style={{
              minWidth: STAGE_W * (zoom / 100) + 96,
              minHeight: STAGE_H * (zoom / 100) + 160,
            }}
          >
            <div
              className="relative shrink-0 shadow-xl"
              style={{
                width: STAGE_W * (zoom / 100),
                height: STAGE_H * (zoom / 100),
              }}
            >
              <div
                className="relative origin-top-left"
                style={{
                  width: STAGE_W,
                  height: STAGE_H,
                  transform: `scale(${zoom / 100})`,
                }}
              >
                <Stage
                  ref={stageRef}
                  width={STAGE_W}
                  height={STAGE_H}
                  onContextMenu={(e) => {
                    if (e.target === e.target.getStage()) { setSelectedId(null); setExtraSelectedIds(new Set()); }
                    openCanvasMenu(e.evt);
                  }}
                  onMouseDown={(e) => {
                    if (e.target !== e.target.getStage()) return;
                    if (!e.evt.shiftKey) { setSelectedId(null); setExtraSelectedIds(new Set()); }
                    const stage = e.target.getStage();
                    const pos = stage?.getPointerPosition();
                    if (!pos) return;
                    marqueeStartRef.current = { x: pos.x, y: pos.y };
                    setMarquee({ x: pos.x, y: pos.y, w: 0, h: 0 });
                  }}
                  onMouseMove={(e) => {
                    const start = marqueeStartRef.current;
                    if (!start) return;
                    const stage = e.target.getStage();
                    const pos = stage?.getPointerPosition();
                    if (!pos) return;
                    setMarquee({
                      x: Math.min(start.x, pos.x),
                      y: Math.min(start.y, pos.y),
                      w: Math.abs(pos.x - start.x),
                      h: Math.abs(pos.y - start.y),
                    });
                  }}
                  onMouseUp={(e) => {
                    const box = marquee;
                    marqueeStartRef.current = null;
                    setMarquee(null);
                    if (!box || (box.w < 3 && box.h < 3)) return;
                    const additive = e.evt.shiftKey;
                    const hits = els.filter((el) => {
                      if (!el.visible || el.locked) return false;
                      return el.x < box.x + box.w && el.x + el.w > box.x && el.y < box.y + box.h && el.y + el.h > box.y;
                    }).map((el) => el.id);
                    if (hits.length === 0) return;
                    if (additive) {
                      setExtraSelectedIds((prev) => {
                        const next = new Set(prev);
                        hits.forEach((id) => { if (id !== selectedId) next.add(id); });
                        return next;
                      });
                    } else {
                      setSelectedId(hits[0]);
                      setExtraSelectedIds(new Set(hits.slice(1)));
                    }
                  }}
                  onTouchStart={(e) => { if (e.target === e.target.getStage()) { setSelectedId(null); setExtraSelectedIds(new Set()); } }}
                >
                  <Layer listening={false}>
                    <Rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={bg} />
                    {showGrid && Array.from({ length: Math.floor(STAGE_W / 40) - 1 }, (_, i) => (
                      <KLine
                        key={`grid-v-${i}`}
                        points={[(i + 1) * 40, 0, (i + 1) * 40, STAGE_H]}
                        stroke="#E5E7EB"
                        strokeWidth={1}
                        listening={false}
                      />
                    ))}
                    {showGrid && Array.from({ length: Math.floor(STAGE_H / 40) - 1 }, (_, i) => (
                      <KLine
                        key={`grid-h-${i}`}
                        points={[0, (i + 1) * 40, STAGE_W, (i + 1) * 40]}
                        stroke="#E5E7EB"
                        strokeWidth={1}
                        listening={false}
                      />
                    ))}
                  </Layer>
                  <Layer>
                    {els.map(renderNode)}
                    {marquee && (marquee.w > 0 || marquee.h > 0) && (
                      <Rect
                        x={marquee.x}
                        y={marquee.y}
                        width={marquee.w}
                        height={marquee.h}
                        fill="rgba(59,130,246,0.10)"
                        stroke="#3b82f6"
                        strokeWidth={1}
                        dash={[4, 4]}
                        listening={false}
                      />
                    )}
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
          </div>
        </div>
          <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200/70 bg-white/80 px-3 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setZoom((value) => Math.max(50, value - 10))}
              className="grid h-6 w-6 place-items-center rounded-full text-xs font-semibold text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Zoom out"
            >
              −
            </button>
            <Slider
              value={[zoom]}
              min={50}
              max={200}
              step={5}
              onValueChange={([value]) => setZoom(value ?? 100)}
              className="w-28 [&_.bg-primary]:bg-neutral-400 [&_.bg-secondary]:bg-neutral-200 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-neutral-300 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-sm"
            />
            <button
              type="button"
              onClick={() => setZoom((value) => Math.min(200, value + 10))}
              className="grid h-6 w-6 place-items-center rounded-full text-xs font-semibold text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Zoom in"
            >
              +
            </button>
            <div className="mx-0.5 h-5 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="grid h-7 w-7 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800"
              aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
              title={isFullscreen ? "Exit full screen" : "Enter full screen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
      </main>
      <CanvasContextMenu />
      </div>

      {/* Right */}
      <aside className="w-[15.5rem] min-w-[15.5rem] max-w-[15.5rem] overflow-y-auto border-l border-neutral-200/80 bg-neutral-50/70 p-2.5">
        <div className="space-y-3">
          <section className="rounded-[24px] border border-brand/15 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Finish your design</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">Make it part of your brand</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {isLogoDesign
                ? assetMeta?.meta?.selected_as_direction
                  ? "Your logo is guiding this brand. Complete the kit, then download everything together."
                  : "First keep this logo. Rocket will use it to create the colours, typography, voice and guidelines around it."
                : "Use this design as your brand style, then keep future work on-brand."}
            </p>
            {assetId ? (
              <button
                type="button"
                onClick={() => void setAsBrandStyle()}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand-hover"
              >
                {assetMeta?.meta?.selected_as_direction ? "Complete your brand kit" : isLogoDesign ? "Keep this logo" : "Use as brand style"}
              </button>
            ) : (
              <Link to="/create" className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand-hover">
                Create another design
              </Link>
            )}
            <button
              type="button"
              onClick={() => exportImage("png")}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" /> Download PNG
            </button>
            {isLogoDesign && (
              <p className="mt-2 text-center text-[11px] text-neutral-500">Keep logo → complete kit → download brand kit</p>
            )}
          </section>
          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Layers</p>
            <div className="max-h-[14rem] overflow-y-auto pr-1">
              {els.length === 0 && <p className="text-xs text-neutral-400">No layers yet.</p>}
              <ul className="space-y-1">
                {[...els].reverse().map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className={`group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${selectedId === e.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
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
          </div>
          {!selected && (
            <div className="rounded-[24px] border border-neutral-200 bg-white/90 p-4 text-xs text-neutral-400 shadow-sm">
              Select a layer to edit its properties.
            </div>
          )}
          {selected && (
            <div className="space-y-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Selected</p>
                  <p className="text-sm font-semibold capitalize text-neutral-900">{selected.kind}</p>
                </div>
                <div className="flex items-center gap-1">
                  <IconAction onClick={() => reorder(selected.id, 1)} label="Up"><ArrowUp className="h-3.5 w-3.5" /></IconAction>
                  <IconAction onClick={() => reorder(selected.id, -1)} label="Down"><ArrowDown className="h-3.5 w-3.5" /></IconAction>
                  <IconAction onClick={() => duplicate(selected.id)} label="Duplicate"><Copy className="h-3.5 w-3.5" /></IconAction>
                  <IconAction onClick={() => remove(selected.id)} label="Delete"><Trash2 className="h-3.5 w-3.5" /></IconAction>
                </div>
              </div>
              <Inspector el={selected} fonts={fontFamilies} onChange={(patch) => update(selected.id, patch as any)} />
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
        </div>
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
  <button onClick={onClick} title={label} className="grid h-8 w-8 place-items-center rounded-xl border border-neutral-200/90 bg-white/75 text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900">{children}</button>
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

const Inspector = ({ el, fonts, onChange }: { el: El; fonts: string[]; onChange: (p: Partial<El>) => void }) => {
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
        <input
          list={FONT_DATALIST_ID}
          value={el.fontFamily}
          onChange={(e) => {
            const nextFont = e.target.value;
            if (fonts.includes(nextFont) || DEFAULT_FONTS.includes(nextFont)) {
              loadGoogleFont(nextFont, [400, 500, 600, 700, 800]);
            }
            onChange({ fontFamily: nextFont } as any);
          }}
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
          placeholder="Search fonts"
        />
        <datalist id={FONT_DATALIST_ID}>
          {fonts.map((f) => (<option key={f} value={f} />))}
        </datalist>
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
  if (el.kind === "image") return (
    <div className="space-y-3">
      <Field label="Color overlay"><ColorInput value={el.color || "#000000"} onChange={(e: any) => onChange({ color: e.target.value } as any)} /></Field>
      {el.color && (
        <button onClick={() => onChange({ color: undefined } as any)} className="text-xs text-neutral-500 hover:text-neutral-900">Clear overlay</button>
      )}
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

function ColorPickerButton({ value, onChange, swatches = [] }: { value: string; onChange: (c: string) => void; swatches?: string[] }) {
  const [hex, setHex] = useState(value || "#000000");
  useEffect(() => { setHex(value || "#000000"); }, [value]);
  const normalize = (v: string) => {
    let s = v.trim();
    if (!s.startsWith("#")) s = "#" + s;
    return s;
  };
  const commitHex = (v: string) => {
    const n = normalize(v);
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(n)) onChange(n);
  };
  const PRESETS = ["#000000", "#FFFFFF", "#EF4444", "#F59E0B", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title="Color picker"
          className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-xl border border-neutral-200/90 bg-white/75 hover:border-neutral-300"
        >
          <span className="h-4 w-4 rounded-sm border border-neutral-300" style={{ background: value || "transparent" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3 p-3">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000"}
          onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
          className="h-10 w-full cursor-pointer rounded-md border border-neutral-200 bg-white"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">HEX</span>
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { commitHex((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
            spellCheck={false}
            className="flex-1 rounded-md border border-neutral-200 px-2 py-1 text-sm font-mono focus:border-neutral-400 focus:outline-none"
          />
        </div>
        {swatches.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-medium text-neutral-500">Brand</div>
            <div className="flex flex-wrap gap-1.5">
              {swatches.slice(0, 12).map((c) => (
                <button key={c} title={c} onClick={() => { setHex(c); onChange(c); }}
                  className="h-6 w-6 rounded-md border border-neutral-200 transition hover:scale-110"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="mb-1.5 text-xs font-medium text-neutral-500">Presets</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((c) => (
              <button key={c} title={c} onClick={() => { setHex(c); onChange(c); }}
                className="h-6 w-6 rounded-md border border-neutral-200 transition hover:scale-110"
                style={{ background: c }} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
