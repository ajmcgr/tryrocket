import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const SiteHeader = () => (
  <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
      <Logo />
      <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
        <a href="/#features" className="hover:text-neutral-900">Features</a>
        <a href="/#pricing" className="hover:text-neutral-900">Pricing</a>
        <Link to="/tools" className="hover:text-neutral-900">Free Tools</Link>
        <Link to="/blog" className="hover:text-neutral-900">Blog</Link>
        <Link to="/about" className="hover:text-neutral-900">About</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link to="/login" className="hidden text-sm font-medium text-neutral-600 hover:text-neutral-900 sm:inline">Sign in</Link>
        <Button asChild>
          <Link to="/signup">Get started <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  </header>
);

export default SiteHeader;