import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { articles, type Article } from "@/content/articles";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const tagsFor = (a: Article): string[] => {
  const t = `${a.title} ${a.excerpt}`.toLowerCase();
  const tags: string[] = [];
  if (/brand|position|tagline|name|bio/.test(t)) tags.push("Branding");
  if (/launch|product hunt|directories|channel/.test(t)) tags.push("Launch");
  if (/founder|indie|cold email|users|pitch/.test(t)) tags.push("Founders");
  if (/landing|tweet|copy|viral/.test(t)) tags.push("Marketing");
  return tags.slice(0, 2).length ? tags.slice(0, 2) : ["Playbook"];
};

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
    {children}
  </span>
);

const Blog = () => {
  const sorted = [...articles].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const [featured, ...rest] = sorted;
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
        {/* Editorial header */}
        <header>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            The Rocket Blog
          </div>
          <h1
            className="mt-6 max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl"
            style={{ fontFamily: "Reckless, ui-serif, Georgia, serif" }}
          >
            Playbooks for founders shipping in public.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
            Tactics, case studies, and field notes on launching, distribution, and building durable brands.
          </p>
        </header>

        {/* Featured article */}
        {featured && (
          <section className="mt-16 border-t border-neutral-200 pt-12">
            <div className="flex flex-wrap gap-2">
              {tagsFor(featured).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            <Link to={`/blog/${featured.slug}`} className="group mt-6 block">
              <h2
                className="max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-neutral-900 transition group-hover:text-neutral-700 sm:text-[2.75rem]"
                style={{ fontFamily: "Reckless, ui-serif, Georgia, serif" }}
              >
                {featured.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600">{featured.excerpt}</p>
              <div className="mt-6 text-sm text-neutral-500">{formatDate(featured.date)}</div>
            </Link>
          </section>
        )}

        {/* More articles */}
        <section className="mt-20 border-t border-neutral-200 pt-12">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">More articles</div>
          <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-2">
            {rest.map((a) => (
              <article key={a.slug}>
                <div className="flex flex-wrap gap-2">
                  {tagsFor(a).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <Link to={`/blog/${a.slug}`} className="group mt-5 block">
                  <h3
                    className="text-2xl font-medium leading-snug tracking-tight text-neutral-900 transition group-hover:text-neutral-700"
                    style={{ fontFamily: "Reckless, ui-serif, Georgia, serif" }}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{a.excerpt}</p>
                  <div className="mt-4 text-xs text-neutral-500">{formatDate(a.date)}</div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Blog;