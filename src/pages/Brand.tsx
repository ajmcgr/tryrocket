import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Image as ImageIcon,
  BookOpen,
  Globe,
  UserCircle2,
  Layers,
  CreditCard,
  Facebook,
  Instagram,
  Presentation,
  Film,
  QrCode,
  FileText,
  Palette as PaletteIcon,
  Type,
  Download,
  Loader2,
  Pencil,
  Check as CheckIcon,
  X as XIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import { supabase as _sb } from "@/integrations/supabase/client";
import { Logotype, logotypeToPng, logotypeToSvg } from "@/components/Logotype";
import { defaultLogotypeState, type LogotypeState } from "@/lib/logotype";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const supabase = _sb as any;

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  disabled?: boolean;
};

type Variant = {
  key: "regular" | "inverse" | "black" | "white";
  label: string;
  bg: string;
  fg: string;
  chipClass: string;
  border?: string;
};

const safeName = (s: string) =>
  s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "logo";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function downloadPng(state: LogotypeState, filename: string) {
  const dataUrl = await logotypeToPng(state, 4);
  const res = await fetch(dataUrl);
  downloadBlob(await res.blob(), `${filename}.png`);
}

function downloadSvg(state: LogotypeState, filename: string) {
  const svg = logotypeToSvg(state);
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
}

async function downloadPdf(state: LogotypeState, filename: string, bg: string) {
  const dataUrl = await logotypeToPng(state, 4);
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = dataUrl;
  });
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const pdf = new jsPDF({ orientation: w >= h ? "landscape" : "portrait", unit: "pt", format: [w, h] });
  if (bg && bg.toLowerCase() !== "#ffffff") {
    pdf.setFillColor(bg);
    pdf.rect(0, 0, w, h, "F");
  }
  pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
  pdf.save(`${filename}.pdf`);
}

export default function Brand() {
  const { id: projectId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  if (!projectId) return <Navigate to="/brands" replace />;

  const [project, setProject] = useState<any>(null);
  const [logoAsset, setLogoAsset] = useState<any>(null);
  const [logoAssets, setLogoAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [section, setSection] = useState<string>("logo-files");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: proj }, { data: pAssets }] = await Promise.all([
        supabase.from("projects").select("id,name,brand_color,user_id").eq("id", projectId).maybeSingle(),
        supabase
          .from("assets")
          .select("id,title,asset_type,editor_state,image_url,thumbnail_url,meta,created_at")
          .eq("project_id", projectId)
          .in("asset_type", ["logo", "logotype", "wordmark"])
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (cancelled) return;
      setProject(proj || null);
      let logos = (pAssets || []).filter(Boolean);
      // Fallback: if the project has no logos, pull the user's most recent logos so the
      // brand kit still shows their generated work instead of an empty state.
      if (!logos.length && user?.id) {
        const { data: userLogos } = await supabase
          .from("assets")
          .select("id,title,asset_type,editor_state,image_url,thumbnail_url,meta,created_at")
          .eq("user_id", user.id)
          .in("asset_type", ["logo", "logotype", "wordmark"])
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(24);
        logos = (userLogos || []).filter(Boolean);
      }
      if (cancelled) return;
      setLogoAssets(logos);
      const withState = logos.find((a: any) => a?.editor_state?.kind === "logotype");
      setLogoAsset(withState || logos[0] || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, user?.id]);

  const startRename = () => { setNameDraft(project?.name || ""); setRenaming(true); };
  const cancelRename = () => { setRenaming(false); setNameDraft(""); };
  const commitRename = async () => {
    const name = nameDraft.trim();
    if (!name || name === project?.name) { cancelRename(); return; }
    setSavingName(true);
    const { error } = await supabase.from("projects").update({ name }).eq("id", projectId);
    setSavingName(false);
    if (error) return toast({ title: "Rename failed", description: error.message, variant: "destructive" });
    setProject((p: any) => ({ ...(p || {}), name }));
    setRenaming(false);
  };

  const brandColor = useMemo(() => {
    const c = String(project?.brand_color || "").trim();
    return /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#1676e3";
  }, [project]);

  const baseState = useMemo<LogotypeState>(() => {
    if (logoAsset?.editor_state?.kind === "logotype") return logoAsset.editor_state as LogotypeState;
    return defaultLogotypeState(project?.name || logoAsset?.title || "Brand");
  }, [logoAsset, project]);

  const logoIsImage = !logoAsset?.editor_state && Boolean(logoAsset?.image_url || logoAsset?.thumbnail_url);
  const logoImageUrl = logoAsset?.image_url || logoAsset?.thumbnail_url;

  const variants = useMemo<Record<Variant["key"], LogotypeState>>(
    () => ({
      regular: { ...baseState, color: baseState.color || "#0A0A0A" },
      inverse: { ...baseState, color: "#FFFFFF" },
      black: { ...baseState, color: "#0A0A0A" },
      white: { ...baseState, color: "#FFFFFF" },
    }),
    [baseState],
  );

  const cards: Variant[] = [
    { key: "regular", label: "Regular", bg: "#FFFFFF", fg: "#0A0A0A", chipClass: "bg-neutral-100 text-neutral-700", border: "border-neutral-200" },
    { key: "inverse", label: "Inverse", bg: brandColor, fg: "#FFFFFF", chipClass: "bg-black/25 text-white" },
    { key: "black", label: "Black", bg: "#FFFFFF", fg: "#0A0A0A", chipClass: "bg-neutral-100 text-neutral-700", border: "border-neutral-200" },
    { key: "white", label: "White", bg: "#0A0A0A", fg: "#FFFFFF", chipClass: "bg-white/15 text-white" },
  ];

  const filenameFor = (v: Variant) => `${safeName(project?.name || baseState.text)}-logo-${v.key}`;

  const handleDownload = async (v: Variant, fmt: "png" | "svg" | "pdf") => {
    const key = `${v.key}:${fmt}`;
    setBusy(key);
    try {
      const state = variants[v.key];
      const name = filenameFor(v);
      if (fmt === "png") await downloadPng(state, name);
      else if (fmt === "svg") downloadSvg(state, name);
      else await downloadPdf(state, name, v.bg);
    } catch (e: any) {
      toast({ title: "Download failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const nav: NavItem[] = [
    { key: "settings", label: "Settings", icon: SettingsIcon, to: `/projects/${projectId}` },
    { key: "logo-files", label: "Logo Files", icon: ImageIcon },
    { key: "brand-guides", label: "Brand Guides", icon: BookOpen, to: `/projects/${projectId}/guidelines` },
    { key: "websites", label: "Websites", icon: Globe, to: `/projects/${projectId}/websites` },
    { key: "profile-icons", label: "Profile Icons", icon: UserCircle2, disabled: true },
    { key: "mockup-designs", label: "Mockup Designs", icon: Layers, disabled: true },
    { key: "business-cards", label: "Business Cards", icon: CreditCard, disabled: true },
    { key: "facebook-covers", label: "Facebook Covers", icon: Facebook, disabled: true },
    { key: "instagram-posts", label: "Instagram Posts", icon: Instagram, to: `/projects/${projectId}/social` },
    { key: "instagram-stories", label: "Instagram Stories", icon: Instagram, to: `/projects/${projectId}/social` },
    { key: "presentations", label: "Presentations", icon: Presentation, disabled: true },
    { key: "animations", label: "Animations", icon: Film, disabled: true },
    { key: "qr-code", label: "QR Code", icon: QrCode, disabled: true },
    { key: "invoices", label: "Invoices", icon: FileText, disabled: true },
    { key: "palette", label: "Palette", icon: PaletteIcon, to: `/projects/${projectId}/palettes` },
    { key: "fonts", label: "Fonts", icon: Type, to: `/projects/${projectId}/fonts` },
  ];

  return (
    <div className="flex h-[calc(100vh-56px)] w-full overflow-hidden bg-neutral-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <Link
            to="/brands"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Back to brands"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-xs font-semibold text-brand-foreground">
            {String(project?.name || "B").trim().slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") cancelRename(); }}
                  className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-brand"
                />
                <button onClick={commitRename} disabled={savingName} className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"><CheckIcon className="h-3.5 w-3.5" /></button>
                <button onClick={cancelRename} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100"><XIcon className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <button onClick={startRename} className="group flex w-full items-center gap-1 truncate text-left text-sm font-semibold text-brand" title="Rename brand">
                <span className="truncate">{project?.name || "Untitled brand"}</span>
                <Pencil className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-70" />
              </button>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-6">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.key;
            const base =
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition";
            const content = (
              <>
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </>
            );
            if (item.disabled) {
              return (
                <div key={item.key} className={`${base} cursor-not-allowed text-neutral-300`}>
                  {content}
                </div>
              );
            }
            if (item.to && item.key !== "logo-files") {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`${base} text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900`}
                >
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`${base} ${
                  isActive
                    ? "bg-neutral-100 font-medium text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-neutral-900">{project?.name ? `${project.name} · Logo Files` : "Logo Files"}</h1>
        </header>

        <div className="px-6 py-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          ) : !logoAsset ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <p className="text-sm text-neutral-600">No logo saved for this brand yet.</p>
              <Link
                to="/create"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand-hover"
              >
                Generate a logo
              </Link>
            </div>
          ) : logoIsImage ? (
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-6 md:grid-cols-2">
                {cards.map((v) => (
                  <div key={v.key} className={`relative overflow-hidden rounded-2xl ${v.border ? `border ${v.border}` : ""} shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]`} style={{ backgroundColor: v.bg }}>
                    <div className="flex aspect-[16/9] items-center justify-center px-10">
                      <img src={logoImageUrl} alt={project?.name || "Logo"} className="max-h-full max-w-full object-contain" style={v.key === "inverse" || v.key === "white" ? { filter: "invert(1) hue-rotate(180deg)" } : undefined} />
                    </div>
                    <div className="pointer-events-none absolute left-4 top-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.chipClass}`}>{v.label}</span>
                    </div>
                    <a href={logoImageUrl} download={`${filenameFor(v)}.png`} target="_blank" rel="noreferrer" className={`absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium shadow-sm transition ${(v.bg === "#FFFFFF") ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white/95 text-neutral-900 hover:bg-white"}`}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
              {logoAssets.length > 1 && (
                <div className="mt-10">
                  <h2 className="text-sm font-semibold text-neutral-700">All saved logos ({logoAssets.length})</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {logoAssets.map((a) => (
                      <button key={a.id} onClick={() => setLogoAsset(a)} className={`overflow-hidden rounded-xl border bg-white transition hover:shadow-sm ${logoAsset?.id === a.id ? "border-brand ring-2 ring-brand/30" : "border-neutral-200"}`}>
                        <div className="flex aspect-square items-center justify-center bg-neutral-50 p-3">
                          {a?.editor_state?.kind === "logotype" ? (
                            <Logotype state={a.editor_state} fit="contain" />
                          ) : (a.image_url || a.thumbnail_url) ? (
                            <img src={a.image_url || a.thumbnail_url} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
              {cards.map((v) => {
                const state = variants[v.key];
                const isDark = v.bg !== "#FFFFFF";
                return (
                  <div
                    key={v.key}
                    className={`relative overflow-hidden rounded-2xl ${v.border ? `border ${v.border}` : ""} shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]`}
                    style={{ backgroundColor: v.bg }}
                  >
                    <div className="flex aspect-[16/9] items-center justify-center px-10">
                      <Logotype state={state} fit="contain" />
                    </div>
                    <div className="pointer-events-none absolute left-4 top-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${v.chipClass}`}>
                        {v.label}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium shadow-sm outline-none transition ${
                            isDark
                              ? "bg-white/95 text-neutral-900 hover:bg-white"
                              : "bg-neutral-900 text-white hover:bg-neutral-800"
                          }`}
                        >
                          {busy?.startsWith(`${v.key}:`) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Download
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={6}
                          className="w-48 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg"
                          style={{ colorScheme: "light" }}
                        >
                          <DropdownMenuItem
                            onClick={() => handleDownload(v, "png")}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm text-neutral-700 focus:bg-neutral-100"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Download className="h-3.5 w-3.5" /> For Web
                            </span>
                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">PNG</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(v, "pdf")}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm text-neutral-700 focus:bg-neutral-100"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Download className="h-3.5 w-3.5" /> For Print
                            </span>
                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(v, "svg")}
                            className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm text-neutral-700 focus:bg-neutral-100"
                          >
                            <span className="inline-flex items-center gap-2">
                              <Download className="h-3.5 w-3.5" /> Vector
                            </span>
                            <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">SVG</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}