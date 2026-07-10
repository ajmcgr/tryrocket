import type {
  BrandVoiceData, BrandGuidelinesData, FounderBio,
  LaunchCopyData, ProductHuntCopyData,
} from "@/lib/assetSchemas";

const nl = "\n";
const br = "\n\n";

function h(level: number, text?: string) { return text ? `${"#".repeat(level)} ${text}${br}` : ""; }
function p(text?: string) { return text ? `${text}${br}` : ""; }
function ul(items?: (string | undefined)[]) {
  const clean = (items || []).filter(Boolean) as string[];
  return clean.length ? clean.map(i => `- ${i}`).join(nl) + br : "";
}

export function brandVoiceToMarkdown(d: BrandVoiceData, title = "Brand voice"): string {
  let md = `# ${title}${br}`;
  md += p(d.overview);
  if (d.pillars?.length) {
    md += h(2, "Voice pillars");
    for (const pl of d.pillars) {
      md += h(3, pl.name);
      md += p(pl.description);
      if (pl.why_it_fits) md += p(`**Why it fits.** ${pl.why_it_fits}`);
      if (pl.example) md += p(`> ${pl.example}`);
    }
  }
  if (d.tone_by_context?.length) {
    md += h(2, "Tone by context");
    md += ul(d.tone_by_context.map(t => `**${t.context}** — ${t.guidance}`));
  }
  if (d.do?.length) { md += h(2, "Do"); md += ul(d.do.map(x => x.why ? `**${x.phrase}** — ${x.why}` : x.phrase)); }
  if (d.dont?.length) { md += h(2, "Don't"); md += ul(d.dont.map(x => x.why ? `**${x.phrase}** — ${x.why}` : x.phrase)); }
  const exSection = (title: string, items?: { label?: string; platform?: string; subject?: string; copy?: string; body?: string }[]) => {
    if (!items?.length) return "";
    let out = h(2, title);
    for (const ex of items) {
      const lbl = ex.label || ex.platform || ex.subject || "";
      if (lbl) out += h(3, lbl);
      const body = ex.copy || ex.body || "";
      if (body) out += p(body);
    }
    return out;
  };
  md += exSection("Website examples", d.website_examples);
  md += exSection("Social examples", d.social_examples);
  md += exSection("Launch examples", d.launch_examples);
  md += exSection("Email examples", d.email_examples);
  return md.trim() + nl;
}

export function brandGuidelinesToMarkdown(d: BrandGuidelinesData): string {
  const title = d.brand_name ? `${d.brand_name} brand guidelines` : "Brand guidelines";
  let md = `# ${title}${br}`;
  md += p(d.overview);
  if (d.mission) md += h(2, "Mission") + p(d.mission);
  if (d.vision) md += h(2, "Vision") + p(d.vision);
  if (d.positioning) md += h(2, "Positioning") + p(d.positioning);
  if (d.audience) md += h(2, "Audience") + p(d.audience);
  if (d.personas?.length) {
    md += h(2, "Personas");
    for (const per of d.personas) {
      md += h(3, per.role ? `${per.name} — ${per.role}` : per.name);
      if (per.demographics) md += p(per.demographics);
      if (per.goals?.length) md += `**Goals**${br}` + ul(per.goals);
      if (per.pains?.length) md += `**Pains**${br}` + ul(per.pains);
      if (per.triggers?.length) md += `**Triggers**${br}` + ul(per.triggers);
      if (per.channels?.length) md += `**Channels**${br}` + ul(per.channels);
      if (per.quote) md += p(`> ${per.quote}`);
    }
  }
  if (d.personality_traits?.length) {
    md += h(2, "Personality");
    md += ul(d.personality_traits.map(t => `**${t.trait}** — ${t.description}`));
  }
  if (d.values?.length) {
    md += h(2, "Values");
    md += ul(d.values.map(v => `**${v.name}** — ${v.description}`));
  }
  if (d.voice?.overview || d.voice?.tone_shifts?.length) {
    md += h(2, "Voice");
    md += p(d.voice?.overview);
    if (d.voice?.tone_shifts?.length) md += ul(d.voice.tone_shifts.map(t => `**${t.context}** — ${t.guidance}`));
  }
  if (d.messaging) {
    md += h(2, "Messaging");
    if (d.messaging.core_message) md += p(`**Core message.** ${d.messaging.core_message}`);
    if (d.messaging.value_prop) md += p(`**Value proposition.** ${d.messaging.value_prop}`);
    if (d.messaging.pillars?.length) {
      md += h(3, "Pillars");
      md += ul(d.messaging.pillars.map(pl => `**${pl.name}** — ${pl.proof}`));
    }
    if (d.messaging.reasons_to_believe?.length) {
      md += h(3, "Reasons to believe");
      md += ul(d.messaging.reasons_to_believe);
    }
  }
  if (d.taglines?.length) { md += h(2, "Taglines"); md += ul(d.taglines); }
  if (d.elevator_pitch) {
    md += h(2, "Elevator pitch");
    if (d.elevator_pitch.one_sentence) md += h(3, "One sentence") + p(d.elevator_pitch.one_sentence);
    if (d.elevator_pitch.thirty_second) md += h(3, "30 seconds") + p(d.elevator_pitch.thirty_second);
    if (d.elevator_pitch.two_minute) md += h(3, "2 minutes") + p(d.elevator_pitch.two_minute);
  }
  if (d.do?.length) { md += h(2, "Do"); md += ul(d.do); }
  if (d.dont?.length) { md += h(2, "Don't"); md += ul(d.dont); }
  if (d.website_examples) {
    md += h(2, "Website examples");
    const w = d.website_examples;
    if (w.hero) { md += h(3, "Hero"); md += p(`**${w.hero.headline}**`); md += p(w.hero.subheadline); }
    if (w.feature) { md += h(3, "Feature"); md += p(`**${w.feature.headline}**`); md += p(w.feature.body); }
    if (w.cta) { md += h(3, "CTA"); md += p(`**${w.cta.headline}**`); md += p(w.cta.body); }
  }
  if (d.social_examples?.length) {
    md += h(2, "Social examples");
    for (const s of d.social_examples) { md += h(3, s.platform); md += p(s.copy); }
  }
  if (d.launch_examples?.length) {
    md += h(2, "Launch examples");
    for (const l of d.launch_examples) { md += h(3, l.label); md += p(l.copy); }
  }
  return md.trim() + nl;
}

export function founderBioToMarkdown(d: FounderBio, title = "Founder bio"): string {
  let md = `# ${title}${br}`;
  const sec = (label: string, v?: string) => v ? h(2, label) + p(v) : "";
  md += sec("Short", d.short);
  md += sec("Medium", d.medium);
  md += sec("Long", d.long);
  md += sec("LinkedIn headline", d.linkedin_headline);
  md += sec("LinkedIn about", d.linkedin_about);
  md += sec("X / Twitter bio", d.x_bio);
  md += sec("Speaker bio", d.speaker_bio);
  md += sec("Press bio", d.press_bio);
  return md.trim() + nl;
}

export function launchCopyToMarkdown(d: LaunchCopyData, title = "Launch copy"): string {
  let md = `# ${title}${br}`;
  if (d.tagline) md += h(2, "Tagline") + p(d.tagline);
  if (d.one_liner) md += h(2, "One-liner") + p(d.one_liner);
  if (d.short_description) md += h(2, "Short description") + p(d.short_description);
  if (d.medium_description) md += h(2, "Medium description") + p(d.medium_description);
  if (d.long_description) md += h(2, "Long description") + p(d.long_description);
  if (d.hero) {
    md += h(2, "Hero");
    md += p(`**${d.hero.headline}**`);
    md += p(d.hero.subheadline);
    md += p(`_CTA:_ ${d.hero.cta}`);
  }
  if (d.cta_variations?.length) { md += h(2, "CTA variations"); md += ul(d.cta_variations); }
  if (d.launch_announcement) md += h(2, "Launch announcement") + p(d.launch_announcement);
  if (d.seo) {
    md += h(2, "SEO");
    md += p(`**Title.** ${d.seo.title}`);
    md += p(`**Meta description.** ${d.seo.meta_description}`);
  }
  return md.trim() + nl;
}

export function productHuntCopyToMarkdown(d: ProductHuntCopyData, title = "Product Hunt copy"): string {
  let md = `# ${title}${br}`;
  if (d.tagline) md += h(2, "Tagline") + p(d.tagline);
  if (d.short_description) md += h(2, "Short description") + p(d.short_description);
  if (d.full_description) md += h(2, "Full description") + p(d.full_description);
  if (d.first_comment) md += h(2, "First comment") + p(d.first_comment);
  if (d.maker_comment) md += h(2, "Maker comment") + p(d.maker_comment);
  if (d.launch_tweet) md += h(2, "Launch tweet") + p(d.launch_tweet);
  if (d.topics?.length) { md += h(2, "Topics"); md += ul(d.topics); }
  if (d.faq?.length) {
    md += h(2, "FAQ");
    for (const q of d.faq) { md += h(3, q.q); md += p(q.a); }
  }
  if (d.community_responses?.length) {
    md += h(2, "Community responses");
    for (const c of d.community_responses) { md += h(3, c.scenario); md += p(c.reply); }
  }
  return md.trim() + nl;
}