import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Shapes, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STYLES = ["Line", "Solid", "Duotone", "3D", "Rounded", "Geometric", "Playful", "Minimal"] as const;

const IconDesigner = () => {
  const nav = useNavigate();
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState<string>("Line");
  const [notes, setNotes] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = subject.trim();
    if (!s) return;
    const prompt = [
      `A ${style.toLowerCase()} icon of ${s}`,
      notes.trim(),
      "Centered on a transparent background, crisp, single-object, no text.",
    ].filter(Boolean).join(". ");
    const search = new URLSearchParams({ prompt, asset_type: "icon", count: "6" });
    nav(`/create?${search.toString()}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
          <Shapes className="h-3.5 w-3.5 text-brand" /> Icon Designer
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Design an icon</h1>
        <p className="mt-2 text-sm text-neutral-600">Describe what you want and pick a style. Rocket will generate a set of variations.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Subject <span className="text-red-500">*</span></label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. a paper airplane, a rocket, a coffee cup"
              className="h-11"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-800">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const active = style === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">Notes <span className="text-neutral-400">(optional)</span></label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Colour hints, mood, do's and don'ts"
              rows={3}
            />
          </div>
          <Button type="submit" className="h-12 w-full text-base" disabled={!subject.trim()}>
            Generate icon variations
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IconDesigner;