import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "./ui/button";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "nl", flag: "🇳🇱", label: "Nederlands" },
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
];

const SiteHeader = () => {
  const [lang, setLang] = useState(LANGUAGES[0]);
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center px-6">
        <Logo />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm font-semibold text-neutral-600 md:flex">
          <Link to="/pricing" className="hover:text-neutral-900">Pricing</Link>
          <Link to="/faq" className="hover:text-neutral-900">FAQ</Link>
          <Link to="/blog" className="hover:text-neutral-900">Resources</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-neutral-600 hover:text-neutral-900 focus:outline-none">
              <span className="text-base leading-none">{lang.flag}</span>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto bg-white text-neutral-900 border-neutral-200">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onSelect={() => setLang(l)} className="gap-2 text-neutral-900 focus:bg-neutral-100 focus:text-neutral-900">
                  {l.code === lang.code ? <Check className="h-4 w-4" /> : <span className="w-4" />}
                  <span className="text-base leading-none">{l.flag}</span>
                  <span>{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/login" className="hidden text-sm font-semibold text-neutral-600 hover:text-neutral-900 sm:inline">Log in</Link>
          <Button asChild size="lg" className="rounded-lg px-6 py-3 text-sm">
            <Link to="/signup">Sign up <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;