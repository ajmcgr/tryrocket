import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getArticle } from "@/content/articles";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const article = slug ? getArticle(slug) : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-white text-neutral-900">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-3xl font-semibold">Article not found</h1>
          <Link to="/blog" className="mt-6 inline-block text-brand hover:underline">← Back to blog</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/blog" className="text-sm text-neutral-500 hover:text-neutral-900">← All articles</Link>
        <div className="mt-6 text-xs font-medium uppercase tracking-wider text-brand">{article.readTime} read · {article.date}</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{article.title}</h1>
        <article className="prose prose-neutral mt-10 max-w-none prose-headings:tracking-tight prose-a:text-brand prose-strong:text-neutral-900">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
        </article>
        <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
          <h3 className="text-2xl font-semibold tracking-tight">Ready to launch?</h3>
          <p className="mt-2 text-neutral-600">Generate your complete launch kit in 60 seconds.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/signup">Generate your brand <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogPost;