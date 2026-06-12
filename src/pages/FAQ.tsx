import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQS = [
  { q: "What does Rocket actually generate?", a: "A complete brand kit from a single URL: positioning, taglines, value props, audience analysis, founder bio, social posts, Product Hunt copy, directory submissions, launch strategy, email templates, messaging framework, and a full launch checklist." },
  { q: "What types of brand assets can I create?", a: "Choose from 12 asset types: Brand Guidelines, Brand Templates, Logos, Colors, Fonts, Brand Voice, Photos, Components, Graphics, Icons, Charts, and Launch Copy. Every Rocket generates a full kit across all categories, organized and ready to export." },
  { q: "How long does it take?", a: "About 30–60 seconds. You'll see a live progress UI, then land on your editable Rocket." },
  { q: "Can I edit and regenerate sections?", a: "Yes. Every section has Copy, Edit, and Regenerate. Regenerating a single asset costs 1 credit." },
  { q: "What's a credit?", a: "One full Rocket = 1 credit. Free plan gets 500 credits/month. Growth gets 3,000. You can also top up with credit packs." },
  { q: "Where can I launch from Rocket?", a: "We pre-fill submissions for Product Hunt, BetaList, There's An AI For That, Hacker News, Peerlist, Uneed, Alternative.me, G2, Indie Hackers, and one-click handoff to Launch." },
  { q: "Do you support custom domains / branding?", a: "Yes — Growth plan exports as Markdown and PDF with your brand colors." },
  { q: "Is there a free trial of Growth?", a: "7 days free, no card required on the Free plan to start." },
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