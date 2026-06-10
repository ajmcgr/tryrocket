export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  body: string;
};

const md = (s: string) => s.replace(/^\s+/gm, "");

export const articles: Article[] = [
  {
    slug: "make-your-product-a-brand",
    title: "Make Your Product a Brand: Why Positioning Beats Features",
    excerpt: "Founders ship features. Brands ship meaning. Here's how to make the jump.",
    readTime: "6 min",
    date: "2026-06-10",
    body: md(`# Make Your Product a Brand

Most indie products die not because the code is bad, but because no one can describe what they are in one sentence. A brand is the shortcut your audience takes to remember you.

## The 3 layers of brand
1. **Category** — the shelf you live on.
2. **Promise** — the one outcome you guarantee.
3. **Vibe** — the feeling you leave behind.

If a stranger can repeat all three after 10 seconds on your homepage, you have a brand.

## Tactics
- Lead with a verb, not a noun.
- Pick a fight with the status quo.
- Make your tagline portable — it should survive on a sticker.

Rocket auto-generates all three layers from your URL in under 60 seconds.`),
  },
  {
    slug: "the-perfect-product-hunt-launch",
    title: "The Perfect Product Hunt Launch (2026 Edition)",
    excerpt: "A repeatable framework that gets you in the Top 5 — without begging upvotes.",
    readTime: "9 min",
    date: "2026-06-08",
    body: md(`# The Perfect Product Hunt Launch

Product Hunt is still the cheapest distribution event on the internet. Here's the 2026 playbook.

## 14 days before
- Pick a Tuesday. Avoid Mondays (PH staff picks) and Fridays (low traffic).
- Write three taglines. Test them as ad copy on X first.
- Line up a hunter only if they have a track record — most don't matter anymore.

## Launch day
- Post at 12:01 AM PT.
- First comment from the founder: the *story*, not the spec sheet.
- Reply to every comment within 10 minutes for the first 4 hours.

## What actually moves the needle
- A demo video under 60s.
- A genuine "why I built this" comment.
- Cross-launch on X, LinkedIn, IndieHackers, your newsletter, and Reddit (carefully).`),
  },
  {
    slug: "10-launch-channels-for-vibe-coders",
    title: "10 Launch Channels Every Vibe Coder Should Use",
    excerpt: "Beyond Product Hunt: the underrated distribution channels in 2026.",
    readTime: "7 min",
    date: "2026-06-05",
    body: md(`# 10 Launch Channels for Vibe Coders

1. **Product Hunt** — still the king.
2. **BetaList** — early-adopter SaaS gold.
3. **There's An AI For That** — AI-product SEO juice.
4. **Hacker News** — Tuesday/Wednesday "Show HN" works best.
5. **Peerlist** — engineering audience.
6. **Uneed** — Friday weekly drops.
7. **Alternative.me** — long-tail comparison traffic.
8. **G2** — B2B credibility.
9. **Indie Hackers** — story-driven posts only.
10. **Reddit** — niche subs, never main ones.

Submit to all 10 in one afternoon. Rocket generates the copy for each.`),
  },
  {
    slug: "writing-a-tagline-that-converts",
    title: "Writing a Tagline That Converts (and Survives a Year)",
    excerpt: "The 4-word formula behind the best SaaS taglines of all time.",
    readTime: "5 min",
    date: "2026-06-02",
    body: md(`# Writing a Tagline That Converts

The best taglines follow one of two formulas:
- **Verb + Object** — "Send better emails."
- **Outcome you envy** — "Sleep through your launch."

Avoid: adjectives, jargon, your company name, and the word "platform".

Rocket's Tagline Generator gives you 10 in 5 seconds.`),
  },
  {
    slug: "the-launch-week-checklist",
    title: "The Complete Launch Week Checklist",
    excerpt: "Hour-by-hour, from Sunday prep to Saturday recap.",
    readTime: "11 min",
    date: "2026-05-30",
    body: md(`# Launch Week Checklist

## Sunday
- Final QA. Break your own product on mobile.
- Schedule X thread for 9 AM PT Tuesday.

## Monday
- Soft-launch to your email list. Ask for honest feedback only.
- Post a teaser GIF on X.

## Tuesday (launch day)
- 12:01 AM PT — Product Hunt goes live.
- 8 AM PT — X thread.
- 10 AM PT — IndieHackers, LinkedIn, Reddit (only if you have a real account there).
- 2 PM PT — submit to directories (Rocket generates each).

## Wednesday – Friday
- Reply to every single comment.
- Send a "thank you" email to anyone who signed up.

## Saturday
- Public retro. People love a post-mortem.`),
  },
  {
    slug: "from-zero-to-first-100-users",
    title: "From Zero to First 100 Users (Without Paid Ads)",
    excerpt: "Manual outreach scales further than founders think.",
    readTime: "8 min",
    date: "2026-05-27",
    body: md(`# Zero to 100 Users

Stop building. Start DMing. The first 100 users come from 1,000 personal messages, not 1,000,000 impressions.

## The 4-channel split
- 40% Twitter/X DMs
- 30% LinkedIn cold messages
- 20% relevant Reddit/Discord comments
- 10% email`),
  },
  {
    slug: "the-elevator-pitch-formula",
    title: "The Elevator Pitch Formula That Closes",
    excerpt: "Three sentences that win meetings, investors, and customers.",
    readTime: "4 min",
    date: "2026-05-24",
    body: md(`# The Elevator Pitch Formula

> We help **[audience]** do **[outcome]** without **[pain]**. Unlike **[alternative]**, we **[differentiator]**.

That's it. Fill it in. Read it out loud. Cut adjectives.`),
  },
  {
    slug: "the-anatomy-of-a-viral-launch-tweet",
    title: "The Anatomy of a Viral Launch Tweet",
    excerpt: "What 50 viral launch threads have in common.",
    readTime: "6 min",
    date: "2026-05-20",
    body: md(`# Viral Launch Tweets

- Hook = pattern interrupt in 7 words.
- Show, don't tell — image or 6-second video.
- Personal stakes — "I built this in 3 weeks while my baby slept."
- One clear CTA at the end.`),
  },
  {
    slug: "naming-your-startup",
    title: "How to Name Your Startup in 2026",
    excerpt: "The 5 rules of modern SaaS naming (and the 3 things to avoid).",
    readTime: "7 min",
    date: "2026-05-17",
    body: md(`# Naming Your Startup

Rules:
1. Two syllables max.
2. Easy to spell over the phone.
3. .com or .ai available.
4. No numbers, no "ly" suffix.
5. Says what it does, or invents a category.`),
  },
  {
    slug: "the-founder-bio-that-gets-replies",
    title: "Writing a Founder Bio That Actually Gets Replies",
    excerpt: "Your X bio is a landing page. Treat it like one.",
    readTime: "5 min",
    date: "2026-05-14",
    body: md(`# The Founder Bio Formula

Slot 1: who you help.
Slot 2: what you ship.
Slot 3: proof or personality.

Rocket's Twitter Bio Generator does this for you.`),
  },
  {
    slug: "the-cold-email-that-books-demos",
    title: "The Cold Email Template That Books Demos",
    excerpt: "4 lines. 90% reply rate when targeted well.",
    readTime: "6 min",
    date: "2026-05-11",
    body: md(`# Cold Email That Works

Subject: "quick q about [their company]"

- Line 1: noticed something specific.
- Line 2: connect it to your product.
- Line 3: one-sentence proof.
- Line 4: tiny ask ("worth 15 min?").`),
  },
  {
    slug: "directories-that-actually-drive-traffic",
    title: "The 9 Directories That Actually Drive Traffic",
    excerpt: "We submitted to 40+. These 9 paid off.",
    readTime: "8 min",
    date: "2026-05-08",
    body: md(`# Directories Worth Your Time

- Product Hunt
- BetaList
- There's An AI For That
- Uneed
- Peerlist
- Alternative.me
- G2
- Indie Hackers
- Hacker News (Show HN)

Skip the rest.`),
  },
  {
    slug: "positioning-101-for-indie-hackers",
    title: "Positioning 101 for Indie Hackers",
    excerpt: "April Dunford's framework, distilled for solo founders.",
    readTime: "9 min",
    date: "2026-05-05",
    body: md(`# Positioning 101

- **Competitive alternatives**: what would people use if you didn't exist?
- **Unique attributes**: what only you have.
- **Value**: what those attributes enable.
- **Customer**: who cares most.
- **Market category**: where you compete.`),
  },
  {
    slug: "the-landing-page-that-converts",
    title: "The Landing Page Structure That Converts",
    excerpt: "8 sections, in this order, every time.",
    readTime: "7 min",
    date: "2026-05-02",
    body: md(`# Landing Page Structure

1. Hero (headline + sub + CTA + demo).
2. Social proof.
3. Problem.
4. Solution.
5. Features (3-6 max).
6. Testimonials.
7. Pricing.
8. FAQ + CTA.`),
  },
  {
    slug: "what-to-do-after-launch-day",
    title: "What To Do The Week After Launch Day",
    excerpt: "The post-launch dip is real. Here's how to keep momentum.",
    readTime: "6 min",
    date: "2026-04-29",
    body: md(`# After Launch Day

- Day 1: thank-you tweet + email.
- Day 2: public metrics post.
- Day 3: ask happy users for testimonials.
- Day 4: ship one tiny improvement and announce it.
- Day 5: schedule the next launch.`),
  },
];

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);