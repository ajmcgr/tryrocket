// .pptx export for presentation assets, derived from the same parsed slides.
import pptxgen from "pptxgenjs";
import { parseMarkdownSections, flattenSections, tryJson, type MarkdownSection, type PresentationData } from "@/lib/assetSchemas";

export async function presentationPptx(title: string, md: string): Promise<Blob> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = title;

  // Prefer structured JSON if the content parses as PresentationData.
  const data = tryJson<PresentationData>(md);
  const useJson = !!data?.slides?.length;
  const sections = useJson ? [] : parseMarkdownSections(md);
  const flat = useJson ? [] : flattenSections(sections);
  const mdSlides = flat.filter((s) => /^slide\s+\d+/i.test(s.title));
  const list: MarkdownSection[] = useJson ? [] : (mdSlides.length ? mdSlides : flat.filter((s) => s.level === 2));
  const totalCount = useJson ? data!.slides.length : list.length;

  // cover
  const cover = pres.addSlide();
  cover.background = { color: "0F0F14" };
  cover.addText(title, { x: 0.6, y: 2.6, w: 12, h: 1.4, fontSize: 44, bold: true, color: "FFFFFF", fontFace: "Helvetica" });
  cover.addText(`${totalCount} slides · Generated with Rocket`, { x: 0.6, y: 4.1, w: 12, h: 0.5, fontSize: 16, color: "A0A0AA" });

  if (useJson) {
    data!.slides.forEach((s, idx) => {
      const slide = pres.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addText(`SLIDE ${idx + 1} / ${totalCount}`, { x: 0.6, y: 0.4, w: 6, h: 0.3, fontSize: 10, color: "999999" });
      slide.addText(s.title || "", {
        x: 0.6, y: 0.9, w: 12, h: 1.2, fontSize: 34, bold: true, color: "111122", fontFace: "Helvetica",
      });
      let y = 2.3;
      if (s.big_number) {
        slide.addText(s.big_number.value, { x: 0.6, y, w: 6, h: 3.5, fontSize: 120, bold: true, color: "111122" });
        slide.addText(s.big_number.label, { x: 6.8, y: y + 1.2, w: 6, h: 2, fontSize: 20, color: "555566" });
      } else if (s.quote) {
        slide.addText(`"${s.quote.text}"`, { x: 0.6, y, w: 12, h: 3, fontSize: 32, italic: true, color: "222233" });
        if (s.quote.attribution) slide.addText(`— ${s.quote.attribution}`, { x: 0.6, y: y + 3.2, w: 12, h: 0.5, fontSize: 16, color: "888899" });
      } else {
        if (s.purpose) { slide.addText(s.purpose, { x: 0.6, y, w: 12, h: 0.8, fontSize: 16, italic: true, color: "555566" }); y += 0.9; }
        const bullets = (s.bullets || []).slice(0, 8);
        if (bullets.length) {
          slide.addText(
            bullets.map((t) => ({ text: t, options: { bullet: true, color: "222233", fontSize: 18 } })),
            { x: 0.7, y, w: 12, h: 7.5 - y - 0.4, paraSpaceAfter: 6 },
          );
        }
      }
      if (s.visual_guidance) {
        slide.addText(`Visual direction · ${s.visual_guidance}`, { x: 0.6, y: 7.0, w: 12, h: 0.3, fontSize: 10, italic: true, color: "888899" });
      }
    });
    const bufJson = (await pres.write({ outputType: "blob" })) as Blob;
    return bufJson;
  }

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