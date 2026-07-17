type DesignSearchFields = {
  title?: string | null;
  prompt?: string | null;
  content?: string | null;
  asset_type?: string | null;
  created_at?: string | null;
  creator_username?: string | null;
  meta?: unknown;
};

type ProjectSearchFields = {
  name?: string | null;
  description?: string | null;
  created_at?: string | null;
};

const TYPE_ALIASES: Record<string, string[]> = {
  logo: ["logo", "logos", "logotype", "logotypes", "wordmark", "wordmarks", "brandmark", "brandmarks", "mark"],
  brand_guidelines: ["brand guidelines", "brand guide", "brand book", "identity guide"],
  color_system: ["color", "colors", "colour", "colours", "palette", "palettes"],
  font_system: ["font", "fonts", "typography", "typeface", "typefaces"],
  brand_voice: ["brand voice", "tone", "messaging", "copy voice"],
  graphic: ["graphic", "graphics", "hero", "banner", "visual", "visuals"],
  icon: ["icon", "icons", "favicon", "favicons", "symbol", "symbols"],
  photo: ["photo", "photos", "image", "images", "photography"],
  template: ["template", "templates", "layout", "layouts"],
  launch_copy: ["launch copy", "launch", "launches", "website copy"],
  product_hunt_copy: ["product hunt", "ph copy", "producthunt"],
  social_post: ["social", "social post", "social posts", "linkedin", "twitter", "x post"],
  founder_bio: ["founder bio", "bio", "about founder"],
  presentation: ["presentation", "presentations", "pitch deck", "slide", "slides"],
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

const flattenMeta = (value: unknown): string => {
  if (!value) return "";
  try {
    return JSON.stringify(value).slice(0, 8000).toLowerCase();
  } catch {
    return "";
  }
};

export const searchTerms = (query: string) =>
  normalize(query)
    .split(/\s+/)
    .filter((term) => term.length > 1);

const recencyBonus = (value?: string | null) => {
  const timestamp = value ? new Date(value).getTime() : 0;
  if (!timestamp || Number.isNaN(timestamp)) return 0;
  const daysOld = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  return Math.max(0, 6 - daysOld / 15);
};

const scoreText = (value: string, terms: string[], exactQuery: string, weight: number) => {
  if (!value) return 0;
  let score = exactQuery && value.includes(exactQuery) ? weight * 3 : 0;
  for (const term of terms) {
    if (value === term) score += weight * 2;
    else if (value.includes(term)) score += weight;
  }
  return score;
};

export const scoreDesignRelevance = (design: DesignSearchFields, query: string) => {
  const exactQuery = normalize(query);
  const terms = searchTerms(query);
  if (!exactQuery) return recencyBonus(design.created_at);

  const title = normalize(design.title);
  const prompt = normalize(design.prompt);
  const content = normalize(design.content).slice(0, 8000);
  const creator = normalize(design.creator_username);
  const meta = flattenMeta(design.meta);
  const assetType = normalize(design.asset_type);

  let score = 0;
  score += scoreText(title, terms, exactQuery, 30);
  score += scoreText(prompt, terms, exactQuery, 15);
  score += scoreText(meta, terms, exactQuery, 12);
  score += scoreText(content, terms, exactQuery, 7);
  score += scoreText(creator, terms, exactQuery, 9);

  const aliases = TYPE_ALIASES[assetType] || assetType.split(/[_-]/).filter(Boolean);
  for (const alias of aliases) {
    if (exactQuery.includes(alias) || terms.some((term) => alias.includes(term) || term.includes(alias))) score += 18;
  }

  return score + recencyBonus(design.created_at);
};

export const matchesDesignQuery = (design: DesignSearchFields, query: string) => {
  if (!normalize(query)) return true;
  return scoreDesignRelevance(design, query) > recencyBonus(design.created_at);
};

export const designSearchText = (design: DesignSearchFields) => {
  const assetType = normalize(design.asset_type);
  return [
    design.title,
    design.prompt,
    design.content,
    design.creator_username,
    flattenMeta(design.meta),
    assetType,
    ...(TYPE_ALIASES[assetType] || []),
  ]
    .filter(Boolean)
    .join(" ");
};

export const rankDesignsByRelevance = <T extends DesignSearchFields>(designs: T[], query: string) =>
  [...designs].sort((left, right) => {
    const scoreDiff = scoreDesignRelevance(right, query) - scoreDesignRelevance(left, query);
    if (scoreDiff !== 0) return scoreDiff;
    return +new Date(right.created_at || 0) - +new Date(left.created_at || 0);
  });

export const scoreProjectRelevance = (project: ProjectSearchFields, query: string) => {
  const exactQuery = normalize(query);
  const terms = searchTerms(query);
  if (!exactQuery) return recencyBonus(project.created_at);
  return (
    scoreText(normalize(project.name), terms, exactQuery, 30) +
    scoreText(normalize(project.description), terms, exactQuery, 12) +
    recencyBonus(project.created_at)
  );
};

export const rankProjectsByRelevance = <T extends ProjectSearchFields>(projects: T[], query: string) =>
  [...projects].sort((left, right) => {
    const scoreDiff = scoreProjectRelevance(right, query) - scoreProjectRelevance(left, query);
    if (scoreDiff !== 0) return scoreDiff;
    return +new Date(right.created_at || 0) - +new Date(left.created_at || 0);
  });
