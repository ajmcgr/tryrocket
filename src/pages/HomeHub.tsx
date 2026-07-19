import { Link } from "react-router-dom";
import { LayoutGrid, Package, Sparkles as SparklesIcon, Palette } from "lucide-react";

/**
 * Logged-in landing page — four big colored cards routing to Rocket's
 * primary logo-first surfaces.
 */
const HomeHub = () => {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-4xl grid-cols-2 gap-6">
        <HubCard
          to="/create/generate"
          title="Wizard"
          subtitle="Auto-generate hundreds of logos"
          bg="bg-[#7B8CF7]"
          hover="hover:bg-[#6B7CE7]"
          icon={<LayoutGrid className="h-6 w-6" />}
        />
        <HubCard
          to="/templates"
          title="Templates"
          subtitle="Start from a logo template"
          bg="bg-[#4CD9A0]"
          hover="hover:bg-[#3AC48D]"
          icon={<Package className="h-6 w-6" />}
        />
        <HubCard
          to="/logos"
          title="Logo Designer"
          subtitle="Design a logo from a brief"
          bg="bg-[#1676e3]"
          hover="hover:bg-[#1268c9]"
          icon={<Palette className="h-6 w-6" />}
        />
        <HubCard
          to="/icons"
          title="Icon Designer"
          subtitle="Prompt to create a unique icon"
          bg="bg-[#EE5FA6]"
          hover="hover:bg-[#E14C97]"
          icon={<SparklesIcon className="h-6 w-6" />}
        />
      </div>
    </div>
  );
};

const HubCard = ({
  to,
  title,
  subtitle,
  bg,
  hover,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  bg: string;
  hover: string;
  icon: React.ReactNode;
}) => (
  <Link
    to={to}
    className={`group flex aspect-[5/4] flex-col justify-between rounded-3xl p-8 text-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] transition ${bg} ${hover}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1.5 max-w-[16rem] text-sm/6 text-white/85">{subtitle}</p>
      </div>
      <span className="opacity-90 transition group-hover:scale-110">{icon}</span>
    </div>
  </Link>
);

export default HomeHub;
