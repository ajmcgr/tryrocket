import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQS = [
  { q: "What does Rocket actually generate?", a: "A complete brand system from a single URL or prompt: logos and logotypes, color palettes, typography, brand voice, launch copy, social posts, Product Hunt kits, email templates, and a full Brand Kit you can export or drop into any design." },
  { q: "How is Rocket organized?", a: "Three surfaces work together: Projects (per-product folders that hold your designs, assets and uploads), Designs (every editable design across your workspace), and Assets/Files (your Brand Kit — one canonical logo, palette, typeface, etc. per project). Templates give you a starting point in one click." },
  { q: "What's the difference between Designs and Assets?", a: "Designs are editable canvas files (logos, graphics, social posts, launch copy) that open in the Rocket editor. Assets are the brand-kit items pinned to a project — one logo, one palette, one typography set — used as the source of truth other designs pull from." },
  { q: "How does the Brand Kit work?", a: "Each project has a Brand Kit with a single canonical item per category (logo, colors, typography, design system, and more). You can swap or remove any item — the Remove dialog moves it to Trash and you can restore it within 30 days. Add extras from any other project through the '+ New' picker." },
  { q: "Can I edit designs like Canva?", a: "Yes. The Rocket editor supports multi-select (Shift-click and marquee), drag-resize, color overlays for logos and images, image uploads with resize, layers on the right panel, and export to PNG/SVG/PDF/ZIP. Brand colors from your kit appear as one-click swatches in the toolbar." },
  { q: "What about uploads?", a: "Any image you drop into the editor is mirrored to Uploads in /projects so you can reuse it across designs. Uploads are strictly local files — generated images don't clutter this view." },
  { q: "Do I get notified when things finish?", a: "Yes. In-app notifications fire for every new design generated, image uploaded, duplicate saved, and background job that completes. Open the bell in the top bar to see history." },
  { q: "How long does a generation take?", a: "Most designs land in 30–60 seconds. You'll see a live progress UI in /create with your full chat history — prompts and responses persist per project so you can scroll back and iterate." },
  { q: "Can I regenerate individual pieces?", a: "Yes. Every design has Copy, Edit, and Regenerate. Regenerating a single design costs 1 credit, and you can leave feedback ('avoid this competitor', 'more minimal', 'brighter') to steer the next pass." },
  { q: "What's a credit?", a: "Credits power every generation. Text designs cost 1 credit; images cost more depending on size and model. Free plan gets 100 credits/month, Pro gets 3,000. Top up anytime with credit packs — they never expire." },
  { q: "Where can I launch from Rocket?", a: "We pre-fill submissions for Product Hunt, BetaList, There's An AI For That, Hacker News, Peerlist, Uneed, Alternative.me, G2, Indie Hackers, and one-click handoff to Launch." },
  { q: "Can I share a design or project?", a: "Yes. Every design gets a share link (opens in the editor in a new tab). Projects can share a whole Brand Kit view. Password-protected links are available on Pro." },
  { q: "Do you support exports?", a: "Yes — PNG, SVG, PDF, and full ZIP packs of your Brand Kit. Pro also exports Markdown and PDF brand guidelines with your palette and typography applied." },
  { q: "Is there a free trial of Pro?", a: "7 days free on Pro, no card required to start on Free." },
  { q: "Can I cancel anytime?", a: "Yes, from Settings → Manage Billing. You'll keep access until the end of the period." },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <SiteHeader />

      <section className="border-b border-neutral-200/60">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Frequently asked</h1>
            <p className="mt-3 text-neutral-600">Everything you wanted to know about Rocket.</p>
          </div>
          <Accordion type="single" collapsible className="mt-10 w-full space-y-4">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:border-brand/30 data-[state=open]:ring-1 data-[state=open]:ring-brand data-[state=open]:shadow-lg data-[state=open]:shadow-brand/5"
              >
                <AccordionTrigger className="px-6 py-5 text-left text-lg font-semibold text-neutral-900">{f.q}</AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-neutral-600 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand/10 bg-brand/5 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-neutral-900">Still have questions?</p>
              <p className="text-sm text-neutral-500">We're here to help you build something great.</p>
            </div>
            <Button asChild>
              <a href="mailto:alex@tryrocket.ai">Contact Support</a>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default FAQ;
