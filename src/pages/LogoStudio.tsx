import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, LayoutTemplate, Shapes, FolderOpen, ArrowRight, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STYLE_OPTIONS = [
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "luxury", label: "Luxury" },
  { id: "technology", label: "Technology" },
  { id: "startup", label: "Startup" },
  { id: "playful", label: "Playful" },
  { id: "vintage", label: "Vintage" },
  { id: "abstract", label: "Abstract" },
] as const;

const INDUSTRIES = [
  "SaaS", "Fintech", "AI", "Healthcare", "Consumer", "Ecommerce", "Education", "Media", "Agency", "Other",
];

const LogoStudio = () => {
  const nav = useNavigate();
  const [brand, setBrand] = useState("");
  const [slogan, setSlogan] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [style, setStyle] = useState<string>("modern");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = brand.trim();
    if (!name) return;
    const parts = [
      `A ${style} logo for ${name}`,
      industry && `in the ${industry} industry`,
      slogan && `— tagline: "${slogan.trim()}"`,
      description.trim() && description.trim(),
      website.trim() && `Website: ${website.trim()}`,
    ].filter(Boolean);
    const prompt = parts.join(". ");
    const search = new URLSearchParams({
      prompt,
      asset_type: "logo",
      count: "8",
    });
    nav(`/create?${search.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
          <Sparkles className="h-3.5 w-3.5 text-brand" /> Logo Studio
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          Create your startup logo
        </h1>
        <p className="mt-2 max-w-xl text-sm text-neutral-600 sm:text-base">
          Tell us about your brand and Rocket will design a full set of logo concepts — logotype, icon, and mockups.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Brand name <span className="text-red-500">*</span></label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Rocket"
              autoFocus
              required
              className="h-11"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Slogan <span className="text-neutral-400">(optional)</span></label>
            <Input
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="A short tagline"
              className="h-11"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Website <span className="text-neutral-400">(optional)</span></label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="brand.com"
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Industry <span className="text-neutral-400">(optional)</span></label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
              >
                <option value="">Select an industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Description <span className="text-neutral-400">(optional)</span></label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you do? Who is it for?"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((s) => {
                const active = style === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            type="submit"
            className="h-12 w-full text-base"
            disabled={!brand.trim()}
          >
            Generate logo concepts
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink to="/templates" icon={LayoutTemplate} label="Templates" />
        <QuickLink to="/icons" icon={Shapes} label="Icon Designer" />
        <QuickLink to="/logos" icon={Sparkles} label="Saved Logos" />
        <QuickLink to="/projects" icon={FolderOpen} label="Projects" />
      </div>

      <div className="mx-auto mt-8 max-w-2xl text-center text-xs text-neutral-500">
        Prefer a conversational brief?{" "}
        <Link to="/create?chat=1" className="font-medium text-brand hover:underline">
          Open the chat brief
        </Link>
      </div>
    </div>
  );
};

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link
    to={to}
    className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-4 text-center text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:text-neutral-950"
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white">
      <Icon className="h-4 w-4" />
    </span>
    {label}
  </Link>
);

export default LogoStudio;