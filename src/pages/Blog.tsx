import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { articles } from "@/content/articles";
import { ArrowRight } from "lucide-react";

const Blog = () => (
  <div className="min-h-screen bg-white text-neutral-900">
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">The Rocket Blog</h1>
        <p className="mt-4 text-lg text-neutral-600">Playbooks, frameworks, and tactics for founders who want to launch better.</p>
      </header>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <Link key={a.slug} to={`/blog/${a.slug}`} className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-brand hover:shadow-md">
            <div className="text-xs font-medium uppercase tracking-wider text-brand">{a.readTime} read</div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight group-hover:text-brand">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{a.excerpt}</p>
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-900">Read article <ArrowRight className="h-3.5 w-3.5" /></div>
          </Link>
        ))}
      </div>
    </main>
    <SiteFooter />
  </div>
);

export default Blog;