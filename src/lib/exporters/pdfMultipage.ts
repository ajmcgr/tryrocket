// Multi-page PDF renderer for structured text assets.
// Used for brand_guidelines (one page per ## section), presentations,
// and copy/social/founder boards. Markdown-aware (headings, bullets, blockquotes).
import jsPDF from "jspdf";
import { parseMarkdownSections, type MarkdownSection } from "@/lib/assetSchemas";

const MARGIN = 56;
const PAGE_W = 612; // letter pt
const PAGE_H = 792;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Ctx = { pdf: jsPDF; y: number };

function newPage(ctx: Ctx) {
  ctx.pdf.addPage();
  ctx.y = MARGIN;
}
function ensure(ctx: Ctx, h: number) {
  if (ctx.y + h > PAGE_H - MARGIN) newPage(ctx);
}
function setFont(ctx: Ctx, weight: "normal" | "bold" | "italic", size: number) {
  ctx.pdf.setFont("helvetica", weight === "italic" ? "italic" : weight);
  ctx.pdf.setFontSize(size);
}
function writeWrapped(ctx: Ctx, text: string, opts: { size: number; weight?: "normal" | "bold" | "italic"; lineHeight?: number; color?: [number, number, number]; indent?: number; gap?: number }) {
  const { size, weight = "normal", lineHeight = 1.45, color = [25, 25, 25], indent = 0, gap = 6 } = opts;
  setFont(ctx, weight, size);
  ctx.pdf.setTextColor(...color);
  const w = CONTENT_W - indent;
  const lines = ctx.pdf.splitTextToSize(text, w);
  const lh = size * lineHeight;
  for (const ln of lines) {
    ensure(ctx, lh);
    ctx.pdf.text(ln, MARGIN + indent, ctx.y + size);
    ctx.y += lh;
  }
  ctx.y += gap;
}

function renderBodyLines(ctx: Ctx, body: string) {
  const lines = (body || "").split(/\r?\n/);
  let para: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    writeWrapped(ctx, para.join(" "), { size: 11, lineHeight: 1.5, color: [55, 55, 55] });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); continue; }
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const t = line.replace(/^[-*]\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1");
      writeWrapped(ctx, "•  " + t, { size: 11, lineHeight: 1.5, indent: 8, color: [55, 55, 55], gap: 2 });
    } else if (/^>\s?/.test(line)) {
      flushPara();
      writeWrapped(ctx, line.replace(/^>\s?/, ""), { size: 11, weight: "italic", lineHeight: 1.5, indent: 12, color: [90, 90, 90] });
    } else {
      para.push(line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1"));
    }
  }
  flushPara();
}

function renderSection(ctx: Ctx, s: MarkdownSection, depth = 0) {
  const size = depth === 0 ? 16 : depth === 1 ? 13 : 11;
  ensure(ctx, size * 2);
  writeWrapped(ctx, s.title, { size, weight: "bold", color: [10, 10, 10], gap: 4 });
  if (s.body.trim()) renderBodyLines(ctx, s.body);
  for (const c of s.children) renderSection(ctx, c, depth + 1);
}

function coverPage(ctx: Ctx, title: string, subtitle?: string) {
  // big block on first page
  ctx.pdf.setFillColor(245, 245, 247);
  ctx.pdf.rect(0, 0, PAGE_W, PAGE_H, "F");
  ctx.pdf.setTextColor(10, 10, 10);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setFontSize(34);
  const wrapped = ctx.pdf.splitTextToSize(title, CONTENT_W);
  ctx.pdf.text(wrapped, MARGIN, 280);
  if (subtitle) {
    ctx.pdf.setFont("helvetica", "normal");
    ctx.pdf.setFontSize(13);
    ctx.pdf.setTextColor(90, 90, 90);
    ctx.pdf.text(ctx.pdf.splitTextToSize(subtitle, CONTENT_W), MARGIN, 320);
  }
  ctx.pdf.setFont("helvetica", "normal");
  ctx.pdf.setFontSize(9);
  ctx.pdf.setTextColor(150, 150, 150);
  ctx.pdf.text("Generated with Rocket", MARGIN, PAGE_H - MARGIN);
}

export function brandGuidelinesPdf(title: string, md: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const ctx: Ctx = { pdf, y: MARGIN };
  coverPage(ctx, title, "Brand Guidelines");
  const sections = parseMarkdownSections(md);
  const pages = sections.length === 1 && sections[0].children.length > 0 ? sections[0].children : sections;
  for (let i = 0; i < pages.length; i++) {
    newPage(ctx);
    // page header strip
    pdf.setFillColor(250, 250, 252);
    pdf.rect(0, 0, PAGE_W, 32, "F");
    pdf.setFontSize(9); pdf.setTextColor(140, 140, 140); pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${i + 1} of ${pages.length}`, MARGIN, 20);
    pdf.text(title, PAGE_W - MARGIN, 20, { align: "right" });
    ctx.y = 56;
    renderSection(ctx, pages[i], 0);
  }
  return pdf.output("blob");
}

export function structuredMarkdownPdf(title: string, md: string, subtitle?: string): Blob {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const ctx: Ctx = { pdf, y: MARGIN };
  coverPage(ctx, title, subtitle);
  newPage(ctx);
  const sections = parseMarkdownSections(md);
  for (const s of sections) renderSection(ctx, s, 0);
  return pdf.output("blob");
}

export function presentationPdf(title: string, md: string): Blob {
  // landscape 16:9 deck (one section = one slide)
  const pdf = new jsPDF({ unit: "pt", format: [960, 540], orientation: "landscape" });
  const W = 960, H = 540, M = 56;
  const sections = parseMarkdownSections(md);
  const flat: MarkdownSection[] = [];
  const walk = (arr: MarkdownSection[]) => { for (const s of arr) { flat.push(s); walk(s.children); } };
  walk(sections);
  const slides = flat.filter((s) => /^slide\s+\d+/i.test(s.title));
  const list = slides.length ? slides : flat.filter((s) => s.level === 2);

  // cover
  pdf.setFillColor(15, 15, 20); pdf.rect(0, 0, W, H, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(40);
  pdf.text(pdf.splitTextToSize(title, W - M * 2), M, 260);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(14); pdf.setTextColor(160, 160, 170);
  pdf.text(`${list.length} slides · Generated with Rocket`, M, 300);

  list.forEach((s, idx) => {
    pdf.addPage([W, H], "landscape");
    pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, "F");
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(150, 150, 150);
    pdf.text(`SLIDE ${idx + 1} / ${list.length}`, M, 40);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(30); pdf.setTextColor(15, 15, 25);
    const titleLines = pdf.splitTextToSize(s.title.replace(/^slide\s+\d+\s*—\s*/i, ""), W - M * 2);
    pdf.text(titleLines, M, 100);
    let y = 100 + titleLines.length * 36 + 20;
    const purpose = (s.body.match(/\*\*Purpose:\*\*\s*([^\n]+)/i) || [])[1];
    if (purpose) {
      pdf.setFont("helvetica", "italic"); pdf.setFontSize(14); pdf.setTextColor(90, 90, 100);
      const pl = pdf.splitTextToSize(purpose.trim(), W - M * 2);
      pdf.text(pl, M, y); y += pl.length * 18 + 16;
    }
    const bullets = s.body.split(/\r?\n/).filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1"));
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(16); pdf.setTextColor(40, 40, 50);
    for (const b of bullets.slice(0, 6)) {
      const lines = pdf.splitTextToSize("•  " + b, W - M * 2 - 12);
      if (y + lines.length * 22 > H - M) break;
      pdf.text(lines, M + 12, y); y += lines.length * 22 + 6;
    }
  });
  return pdf.output("blob");
}