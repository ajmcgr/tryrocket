// Workflow definitions for Rocket. Each workflow maps a user intent to:
//  - a list of text assets to generate
//  - optional image asset slots (Design workflow only for now)
//  - a workflow-specific system / user prompt

export type Workflow = "brand" | "design" | "launch" | "promote";

export interface TextAssetSpec { asset_type: string; title: string; }

export interface WorkflowSpec {
  workflow: Workflow;
  label: string;
  text_assets: TextAssetSpec[];
  // Image generation: how many image concepts to produce. AI returns
  // image_prompt_1..N + image_concept_1..N strings in the same JSON call.
  image_count: number;
  system: string;
  // Build a user prompt given context. The AI must return strict JSON with
  // keys matching every text_asset.asset_type plus product_name, and (when
  // image_count > 0) image_prompt_1..N + image_concept_1..N.
  buildUserPrompt(ctx: { contextBlock: string; imagesAttachedNote: string }): string;
}

const BRAND: WorkflowSpec = {
  workflow: "brand",
  label: "Brand It",
  image_count: 0,
  text_assets: [
    { asset_type: "positioning_tagline", title: "Tagline" },
    { asset_type: "positioning_value_prop", title: "Value Proposition" },
    { asset_type: "positioning_elevator", title: "Elevator Pitch" },
    { asset_type: "positioning_audience", title: "Target Audience" },
    { asset_type: "positioning_category", title: "Product Category" },
    { asset_type: "positioning_differentiator", title: "Key Differentiator" },
    { asset_type: "audience_ideal_customer", title: "Ideal Customer" },
    { asset_type: "audience_pain_points", title: "Pain Points" },
    { asset_type: "audience_use_cases", title: "Use Cases" },
    { asset_type: "audience_messaging", title: "Messaging Angles" },
    { asset_type: "founder_bio", title: "Founder Bio" },
    { asset_type: "founder_tagline", title: "Founder Tagline" },
    { asset_type: "founder_x_bio", title: "X Bio" },
    { asset_type: "founder_linkedin", title: "LinkedIn Headline" },
  ],
  system: `You are Rocket, an AI brand co-pilot. Generate brand positioning, audience, and founder messaging. Output a single JSON object. Every value a tight, ready-to-paste non-empty string. Use "- " for bullet lines.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, positioning_tagline, positioning_value_prop, positioning_elevator, positioning_audience, positioning_category, positioning_differentiator, audience_ideal_customer, audience_pain_points, audience_use_cases, audience_messaging, founder_bio, founder_tagline, founder_x_bio, founder_linkedin. Tone: confident, founder-led, specific. RESPOND WITH JSON ONLY.`;
  },
};

const DESIGN: WorkflowSpec = {
  workflow: "design",
  label: "Design It",
  image_count: 3,
  text_assets: [
    { asset_type: "design_style_direction", title: "Style Direction" },
    { asset_type: "design_color_palette", title: "Color Palette" },
    { asset_type: "design_typography", title: "Typography Notes" },
  ],
  system: `You are Rocket, an AI visual brand co-pilot. The user wants visual assets (logos / icons / brand visuals). Generate 3 distinct logo / visual concepts and a tight visual style brief. Every value a non-empty string. Image prompts MUST be ready to paste into a text-to-image model, describe a single image, be vivid, specify style, color, composition, and end with: ", clean white background, vector style, high quality, no text". Output a single JSON object only.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string:
- product_name
- design_style_direction (2-4 short sentences describing the overall visual direction — e.g. modern SaaS, Apple-inspired simplicity, vector-first, scalable favicon)
- design_color_palette (3-5 hex codes with one-line rationale each, "- " bullets)
- design_typography (display + body font recommendations, 2-3 sentences)
- image_concept_1, image_concept_2, image_concept_3 (one short paragraph each — name + description of the concept)
- image_prompt_1, image_prompt_2, image_prompt_3 (a vivid text-to-image prompt for each concept; concepts must be visually distinct)

RESPOND WITH JSON ONLY.`;
  },
};

const LAUNCH: WorkflowSpec = {
  workflow: "launch",
  label: "Launch It",
  image_count: 0,
  text_assets: [
    { asset_type: "launch_submission", title: "Launch Submission" },
    { asset_type: "launch_product_hunt", title: "Product Hunt Copy" },
    { asset_type: "launch_directory", title: "Directory Submission" },
    { asset_type: "founder_story", title: "Founder Story" },
    { asset_type: "strategy_readiness", title: "Launch Readiness Score" },
    { asset_type: "strategy_channels", title: "Recommended Channels" },
    { asset_type: "strategy_communities", title: "Recommended Communities" },
    { asset_type: "strategy_content", title: "Content Ideas" },
    { asset_type: "checklist_pre", title: "Pre-Launch Checklist" },
    { asset_type: "checklist_day", title: "Launch Day Checklist" },
    { asset_type: "checklist_post", title: "Post-Launch Checklist" },
  ],
  system: `You are Rocket, an AI launch strategist. Generate ready-to-ship launch assets and a concrete launch plan. Output a single JSON object. Each value a non-empty, ready-to-paste string. Use "- " bullets for lists. For Launch Readiness Score, return a 0-100 number plus 1-2 sentence rationale.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, launch_submission, launch_product_hunt, launch_directory, founder_story, strategy_readiness, strategy_channels, strategy_communities, strategy_content, checklist_pre, checklist_day, checklist_post. RESPOND WITH JSON ONLY.`;
  },
};

const PROMOTE: WorkflowSpec = {
  workflow: "promote",
  label: "Promote It",
  image_count: 0,
  text_assets: [
    { asset_type: "social_x_post", title: "X Post" },
    { asset_type: "social_x_thread", title: "X Thread" },
    { asset_type: "social_linkedin", title: "LinkedIn Post" },
    { asset_type: "social_reddit", title: "Reddit Post" },
    { asset_type: "social_newsletter", title: "Newsletter Announcement" },
    { asset_type: "promote_influencer_outreach", title: "Influencer Outreach DM" },
    { asset_type: "promote_pr_pitch", title: "PR Pitch Email" },
    { asset_type: "promote_creator_campaign", title: "Creator Campaign Brief" },
  ],
  system: `You are Rocket, an AI growth + PR co-pilot. Generate distribution copy and outreach assets that sound like a real founder, not a marketer. Output a single JSON object. Every value a non-empty, ready-to-paste string. For threads/posts write the actual post copy.`,
  buildUserPrompt({ contextBlock, imagesAttachedNote }) {
    return `${contextBlock}\n\n${imagesAttachedNote}Return a single JSON object with EXACTLY these keys, each a non-empty string: product_name, social_x_post, social_x_thread, social_linkedin, social_reddit, social_newsletter, promote_influencer_outreach, promote_pr_pitch, promote_creator_campaign. RESPOND WITH JSON ONLY.`;
  },
};

export const WORKFLOWS: Record<Workflow, WorkflowSpec> = {
  brand: BRAND,
  design: DESIGN,
  launch: LAUNCH,
  promote: PROMOTE,
};

export const CLASSIFIER_SYSTEM = `You classify a user's request into exactly one of four Rocket workflows. Output strict JSON: {"workflow": "brand" | "design" | "launch" | "promote"}.
- "design" → user wants visual assets: logo, icon, hero image, social graphic, ad creative, thumbnail, screenshot, illustration, brand visuals.
- "launch" → user wants launch copy / launch strategy / Product Hunt assets / launch checklist / founder story / submission copy.
- "promote" → user wants distribution: X thread, LinkedIn post, Reddit post, influencer outreach, PR pitch, creator campaign.
- "brand" → user wants brand identity / positioning / messaging / tagline / audience / value prop / elevator pitch, OR a full brand kit, OR the request is ambiguous and could be a complete brand.
Default to "brand" when uncertain. Respond with JSON only.`;