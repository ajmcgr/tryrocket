import { Link } from "react-router-dom";
import { tools } from "@/content/tools";
import { articles } from "@/content/articles";

const SiteFooter = () => (
  <footer className="border-t border-neutral-200/60 bg-neutral-50">
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-500">Company</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            <li><Link to="/about" className="hover:text-neutral-900">About</Link></li>
            <li><Link to="/blog" className="hover:text-neutral-900">Blog</Link></li>
            <li><Link to="/media-kit" className="hover:text-neutral-900">Media Kit</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-500">Support</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            <li><a href="mailto:alex@tryrocket.ai" className="hover:text-neutral-900">Support</a></li>
            <li><Link to="/privacy" className="hover:text-neutral-900">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-neutral-900">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-500">Resources</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            {articles.slice(0, 10).map((a) => (
              <li key={a.slug}><Link to={`/blog/${a.slug}`} className="hover:text-neutral-900">{a.title}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-500">Free tools</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            {tools.slice(0, 10).map((t) => (
              <li key={t.slug}><Link to={`/tools/${t.slug}`} className="hover:text-neutral-900">{t.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-500">Connect</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            <li><a href="https://x.com/tryrocketai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">X</a></li>
            <li><a href="https://www.instagram.com/tryrocketai/" target="_blank" rel="noreferrer" className="hover:text-neutral-900">Instagram</a></li>
            <li><a href="https://discord.gg/aSkXPHhTjJ" target="_blank" rel="noreferrer" className="hover:text-neutral-900">Discord</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
        Copyright © 2026 Works App, Inc. Built with 🫶🏻 by <a href="https://works.xyz" target="_blank" rel="noreferrer" className="hover:text-neutral-900">Works</a>.
      </div>
    </div>
  </footer>
);

export default SiteFooter;