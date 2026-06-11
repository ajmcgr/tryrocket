import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ProjectSidebar from "@/components/ProjectSidebar";
import {
  Type, Square, Circle as CircleIcon, Image as ImageIcon, Trash2,
  Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Download, Save,
  Minus, StickyNote, Table as TableIcon, Triangle as TriangleIcon, Star as StarIcon, MousePointer2,
} from "lucide-react";

type Base = {
  id: string;
  x: number; y: number; w: number; h: number;
  rotation?: number;
  visible: boolean;
  locked: boolean;
};
type TextEl = Base & { kind: "text"; text: string; color: string; fontSize: number; fontWeight: number; fontFamily: string };
type RectEl = Base & { kind: "rect"; fill: string; radius: number };
type CircEl = Base & { kind: "circle"; fill: string };
type ImgEl  = Base & { kind: "image"; src: string };
type LineEl = Base & { kind: "line"; color: string; thickness: number };
type StickyEl = Base & { kind: "sticky"; text: string; fill: string; color: string };
type TriEl = Base & { kind: "triangle"; fill: string };
type StarEl = Base & { kind: "star"; fill: string };
type TableEl = Base & { kind: "table"; rows: number; cols: number; color: string; lineColor: string };
type El = TextEl | RectEl | CircEl | ImgEl | LineEl | StickyEl | TriEl | StarEl | TableEl;

// Curated Canva-style font list — loaded from Google Fonts at runtime.
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
const STORAGE_KEY = "rocket.editor.v1";

const Editor = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load Google Fonts once.
  useEffect(() => {
    if (document.getElementById("rocket-editor-fonts")) return;
    const families = FONTS.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700;800`).join("&");
    const link = document.createElement("link");
    link.id = "rocket-editor-fonts";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  const [els, setEls] = useState<El[]>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
    return [];
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bg, setBg] = useState<string>(() => {
    try { return localStorage.getItem("rocket.editor.bg.v1") || "#ffffff"; } catch { return "#ffffff"; }
  });

  const selected = els.find((e) => e.id === selectedId) || null;

  const update = (id: string, patch: Partial<El>) =>
    setEls((prev) => prev.map((e) => (e.id === id ? ({ ...e, ...patch } as El) : e)));
  const remove = (id: string) => { setEls((p) => p.filter((e) => e.id !== id)); if (selectedId === id) setSelectedId(null); };
  const move = (id: string, dir: 1 | -1) => setEls((prev) => {
    const i = prev.findIndex((e) => e.id === id); if (i < 0) return prev;
    const j = i + dir; if (j < 0 || j >= prev.length) return prev;
    const copy = [...prev]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const addText = () => {
    const el: TextEl = { id: uid(), kind: "text", x: 320, y: 260, w: 240, h: 60, visible: true, locked: false,
      text: "Double-click to edit", color: "#111111", fontSize: 32, fontWeight: 600, fontFamily: "Inter, sans-serif" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addRect = () => {
    const el: RectEl = { id: uid(), kind: "rect", x: 300, y: 240, w: 220, h: 140, visible: true, locked: false, fill: "#3b82f6", radius: 12 };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addCircle = () => {
    const el: CircEl = { id: uid(), kind: "circle", x: 320, y: 240, w: 180, h: 180, visible: true, locked: false, fill: "#f97316" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addLine = () => {
    const el: LineEl = { id: uid(), kind: "line", x: 280, y: 300, w: 260, h: 4, visible: true, locked: false, color: "#3b82f6", thickness: 4 };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addSticky = () => {
    const el: StickyEl = { id: uid(), kind: "sticky", x: 300, y: 240, w: 180, h: 180, visible: true, locked: false, text: "Note", fill: "#FDE68A", color: "#111111" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addTriangle = () => {
    const el: TriEl = { id: uid(), kind: "triangle", x: 320, y: 240, w: 180, h: 160, visible: true, locked: false, fill: "#10b981" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addStar = () => {
    const el: StarEl = { id: uid(), kind: "star", x: 320, y: 240, w: 160, h: 160, visible: true, locked: false, fill: "#f59e0b" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const addTable = () => {
    const el: TableEl = { id: uid(), kind: "table", x: 260, y: 220, w: 320, h: 180, visible: true, locked: false, rows: 3, cols: 4, color: "#ffffff", lineColor: "#111827" };
    setEls((p) => [...p, el]); setSelectedId(el.id);
  };
  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = Math.min(400, img.width); const h = w / ratio;
        const el: ImgEl = { id: uid(), kind: "image", x: 300, y: 200, w, h, visible: true, locked: false, src };
        setEls((p) => [...p, el]); setSelectedId(el.id);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(els));
    toast({ title: "Saved", description: "Design saved to this browser." });
  };
  const exportPng = async () => {
    if (!canvasRef.current) return;
    const prevSel = selectedId; setSelectedId(null);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, backgroundColor: bg });
      const a = document.createElement("a"); a.href = dataUrl; a.download = "rocket-design.png"; a.click();
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
    setSelectedId(prevSel);
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full bg-neutral-100">
      <ProjectSidebar />
      {/* existing editor layout continues */}
      <div className="flex flex-1">
      {/* Left: tools + layers */}
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

      {/* Center: canvas */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2">
          <span className="text-sm font-medium text-neutral-700">Untitled design</span>
          <span className="ml-2 text-xs text-neutral-400">800 × 600</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={save}><Save className="h-3.5 w-3.5" /> Save</Button>
            <Button size="sm" onClick={exportPng}><Download className="h-3.5 w-3.5" /> Export PNG</Button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto p-8" onClick={() => setSelectedId(null)}>
          <div
            ref={canvasRef}
            onClick={(e) => e.stopPropagation()}
            className="relative shadow-xl"
            style={{ width: 800, height: 600, background: bg }}
          >
            {els.map((e) => {
              if (!e.visible) return null;
              const isSel = selectedId === e.id;
              return (
                <Rnd
                  key={e.id}
                  size={{ width: e.w, height: e.h }}
                  position={{ x: e.x, y: e.y }}
                  disableDragging={e.locked}
                  enableResizing={!e.locked}
                  bounds="parent"
                  onDragStop={(_, d) => update(e.id, { x: d.x, y: d.y } as any)}
                  onResizeStop={(_, __, ref, ___, pos) =>
                    update(e.id, { w: parseFloat(ref.style.width), h: parseFloat(ref.style.height), x: pos.x, y: pos.y } as any)
                  }
                  onMouseDown={(ev) => { ev.stopPropagation(); setSelectedId(e.id); }}
                  style={{ outline: isSel ? "2px solid #3b82f6" : "none", outlineOffset: 1 }}
                >
                  <ElView el={e} onChange={(patch) => update(e.id, patch as any)} />
                </Rnd>
              );
            })}
          </div>
        </div>
      </main>

      {/* Right: inspector */}
      <aside className="w-72 border-l border-neutral-200 bg-white p-4">
        {!selected && <p className="text-xs text-neutral-400">Select a layer to edit its properties.</p>}
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize text-neutral-900">{selected.kind}</p>
              <div className="flex items-center gap-1">
                <IconAction onClick={() => move(selected.id, 1)} label="Up"><ArrowUp className="h-3.5 w-3.5" /></IconAction>
                <IconAction onClick={() => move(selected.id, -1)} label="Down"><ArrowDown className="h-3.5 w-3.5" /></IconAction>
                <IconAction onClick={() => remove(selected.id)} label="Delete"><Trash2 className="h-3.5 w-3.5" /></IconAction>
              </div>
            </div>
            <Inspector el={selected} onChange={(patch) => update(selected.id, patch as any)} />
          </div>
        )}
      </aside>
    </div>
    </div>
  );
};

const ToolBtn = ({ onClick, label, children }: any) => (
  <button onClick={onClick} title={label} className="grid h-9 place-items-center rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900">{children}</button>
);
const IconAction = ({ onClick, label, children }: any) => (
  <button onClick={onClick} title={label} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">{children}</button>
);

const ElView = ({ el, onChange }: { el: El; onChange: (p: Partial<El>) => void }) => {
  if (el.kind === "text") {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange({ text: e.currentTarget.innerText } as any)}
        className="h-full w-full cursor-text select-text outline-none"
        style={{ color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight, fontFamily: el.fontFamily, lineHeight: 1.2 }}
      >{el.text}</div>
    );
  }
  if (el.kind === "rect") return <div className="h-full w-full" style={{ background: el.fill, borderRadius: el.radius }} />;
  if (el.kind === "circle") return <div className="h-full w-full rounded-full" style={{ background: el.fill }} />;
  return <img src={el.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />;
};

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
      <Field label="Font">
        <select value={el.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value } as any)} className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm">
          <option value="Inter, sans-serif">Inter</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="Impact, sans-serif">Impact</option>
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
  if (el.kind === "circle") return (
    <Field label="Fill"><ColorInput value={el.fill} onChange={(e: any) => onChange({ fill: e.target.value } as any)} /></Field>
  );
  return <p className="text-xs text-neutral-500">Drag the corners to resize the image.</p>;
};

export default Editor;