export type Comparison = {
  slug: string;
  tool: string;
  rank: number;
  description: string;
  bestFor: string;
};

export const comparisons: Comparison[] = [
  {
    slug: "make-design",
    tool: "make.design",
    rank: 1,
    description:
      "make.design generates logo directions and matching identity concepts from a description of your company and the feeling you want, so the mark, color, and type all come together. You refine it with prompts or right on the canvas, and everything exports cleanly and is yours to use commercially. It ranks first because it treats a logo as part of a wider identity you can keep building, rather than a one-off icon you have to figure out the rest from.",
    bestFor: "Founders exploring a visual identity, not just one icon",
  },
  {
    slug: "looka",
    tool: "Looka",
    rank: 2,
    description:
      "Looka walks you through your preferences, generates logo options, and then offers brand kits with matching assets. It's a smooth, beginner-friendly experience that gets you to presentable results fast. The guided flow is convenient, though the style can feel familiar across the many businesses that use it.",
    bestFor: "Small businesses wanting a quick, complete brand package",
  },
  {
    slug: "brandmark",
    tool: "Brandmark",
    rank: 3,
    description:
      "Brandmark generates logo concepts with thoughtful color and type pairings, then exports brand assets. It's good at tidy, contemporary marks and showing them in context. Customization is more limited than a full design tool, so deep tweaks can be tricky.",
    bestFor: "Clean, modern marks with coordinated palettes",
  },
  {
    slug: "canva",
    tool: "Canva",
    rank: 4,
    description:
      "Canva gives you a large library of editable logo templates plus its broader design tools. It's handy if you want to make a logo and the rest of your marketing in one place. Since the templates are shared widely, originality takes effort, and the results work best for informal or early-stage brands.",
    bestFor: "DIY logos you'll use alongside other Canva designs",
  },
  {
    slug: "logo-com",
    tool: "Logo.com",
    rank: 5,
    description:
      "Logo.com generates logo options quickly and gives you a simple editor plus brand assets. It's a fast way to get to something workable, especially for a brand-new venture that's still testing ideas. The results are practical and clean rather than highly distinctive.",
    bestFor: "Quick first logos on a tight timeline",
  },
  {
    slug: "logoai",
    tool: "LogoAI",
    rank: 6,
    description:
      "LogoAI creates logos from your name and style choices, then generates matching assets like cards and social templates. It's useful for getting a consistent set of materials together quickly. As with most generators, the strongest results still benefit from a human's touch afterward.",
    bestFor: "Pairing a logo with templated marketing assets",
  },
  {
    slug: "adobe-express",
    tool: "Adobe Express",
    rank: 7,
    description:
      "Adobe Express combines AI-powered design tools with thousands of templates to help you create logos, social graphics, videos, and marketing materials quickly. It works especially well if you want an all-in-one design platform backed by Adobe’s ecosystem, though custom branding often benefits from additional refinement.",
    bestFor: "Creating branded marketing content quickly",
  },
  {
    slug: "figma",
    tool: "Figma",
    rank: 8,
    description:
      "Figma is a collaborative design platform used to create everything from logos and brand identities to websites and product interfaces. With AI features and a large plugin ecosystem, it’s ideal for teams and designers who want complete creative control rather than fully automated results.",
    bestFor: "Professional logo design and collaborative branding workflows",
  },
  {
    slug: "brandforce",
    tool: "BrandForce",
    rank: 9,
    description:
      "BrandForce is a creative growth agency. It analyzes the visual landscape of your category to ensure distinctiveness, develops 3 distinct visual directions based on the brand strategy, extends the chosen direction into a comprehensive design system, and creates final assets ready for global deployment across all channels.",
    bestFor: "Brands that want strategic identity development and agency-led rollout",
  },
];

export const getComparison = (slug: string) =>
  comparisons.find((comparison) => comparison.slug === slug);
