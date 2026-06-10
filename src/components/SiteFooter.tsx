import { Link } from "react-router-dom";
import Logo from "./Logo";
import { tools } from "@/content/tools";

const SiteFooter = () => (
  <footer className="border-t border-neutral-200/60 bg-neutral-50">
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-neutral-600">
            Rocket helps you brand your app with AI. Drop in a URL — get a complete launch kit in 60 seconds.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <a href="https://x.com/tryrocketai" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900">X</a>
            <a href="https://www.instagram.com/tryrocketai/" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900">Instagram</a>
            <a href="https://discord.gg/aSkXPHhTjJ" target="_blank" rel="noreferrer" className="text-neutral-500 hover:text-neutral-900">Discord</a>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Product</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            <li><a href="/#features" className="hover:text-neutral-900">Features</a></li>
            <li><a href="/#pricing" className="hover:text-neutral-900">Pricing</a></li>
            <li><Link to="/signup" className="hover:text-neutral-900">Get started</Link></li>
            <li><a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">TryLaunch.ai</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Free Tools</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            {tools.slice(0, 6).map((t) => (
              <li key={t.slug}><Link to={`/tools/${t.slug}`} className="hover:text-neutral-900">{t.name}</Link></li>
            ))}
            <li><Link to="/tools" className="font-medium text-brand hover:underline">All 15 tools →</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Company</div>
          <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
            <li><Link to="/about" className="hover:text-neutral-900">About</Link></li>
            <li><Link to="/blog" className="hover:text-neutral-900">Blog</Link></li>
            <li><Link to="/media-kit" className="hover:text-neutral-900">Media Kit</Link></li>
            <li><a href="mailto:alex@trylaunch.ai" className="hover:text-neutral-900">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center">
        <span>© Rocket 2026 — Make your product a brand.</span>
        <span>Built by the team behind <a href="https://trylaunch.ai" target="_blank" rel="noreferrer" className="hover:text-neutral-900">TryLaunch.ai</a></span>
      </div>
    </div>
  </footer>
);

export default SiteFooter;