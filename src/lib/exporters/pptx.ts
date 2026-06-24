// .pptx export for presentation assets, derived from the same parsed slides.
import pptxgen from "pptxgenjs";
import { parseMarkdownSections, flattenSections, type MarkdownSection } from "@/lib/assetSchemas";

export async function presentationPptx(title: string, md: string): Promise<Blob> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = title;

  const sections = parseMarkdownSections(md);
  const flat = flattenSections(sections);
  const slides = flat.filter((s) => /^slide\s+\d+/i.test(s.title));
  const list = slides.length ? slides : flat.filter((s) => s.level === 2);

  // cover
  const cover = pres.addSlide();
  cover.background = { color: "0F0F14" };
  cover.addText(title, { x: 0.6, y: 2.6, w: 12, h: 1.4, fontSize: 44, bold: true, color: "FFFFFF", fontFace: "Helvetica" });
  cover.addText(`${list.length} slides · Generated with Rocket`, { x: 0.6, y: 4.1, w: 12, h: 0.5, fontSize: 16, color: "A0A0AA" });

  list.forEach((s: MarkdownSection, idx: number) => {
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(`SLIDE ${idx + 1} / ${list.length}`, { x: 0.6, y: 0.4, w: 6, h: 0.3, fontSize: 10, color: "999999" });
    slide.addText(s.title.replace(/^slide\s+\d+\s*—\s*/i, ""), {
      x: 0.6, y: 0.9, w: 12, h: 1.2, fontSize: 34, bold: true, color: "111122", fontFace: "Helvetica",
    });
    const purpose = (s.body.match(/\*\*Purpose:\*\*\s*([^\n]+)/i) || [])[1];
    let y = 2.3;
    if (purpose) {
      slide.addText(purpose.trim(), { x: 0.6, y, w: 12, h: 0.8, fontSize: 16, italic: true, color: "555566" });
      y += 0.9;
    }
    const bullets = s.body.split(/\r?\n/).filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/\*\*(.*?)\*\*/g, "$1"));
    if (bullets.length) {
      slide.addText(
        bullets.slice(0, 8).map((t) => ({ text: t, options: { bullet: true, color: "222233", fontSize: 18 } })),
        { x: 0.7, y, w: 12, h: 7.5 - y - 0.4, paraSpaceAfter: 6 },
      );
    }
    const visual = (s.body.match(/\*\*Visual guidance:\*\*\s*([^\n]+)/i) || [])[1];
    if (visual) {
      slide.addText(`Visual direction · ${visual.trim()}`, { x: 0.6, y: 7.0, w: 12, h: 0.3, fontSize: 10, italic: true, color: "888899" });
    }
  });

  const buf = (await pres.write({ outputType: "blob" })) as Blob;
  return buf;
}