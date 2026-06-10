import { Link } from "react-router-dom";
import rocketLogo from "@/assets/rocket-logo-white.png.asset.json";

type Props = { to?: string; size?: "sm" | "md"; showWord?: boolean; className?: string };

const Logo = ({ to = "/", size = "md", showWord = true, className = "" }: Props) => {
  const chip = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const img = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const body = (
    <span className={`flex items-center gap-2 text-base font-semibold tracking-tight ${className}`}>
      <span className={`grid ${chip} place-items-center rounded-lg bg-brand`}>
        <img src={rocketLogo.url} alt="Rocket" className={`${img} object-contain`} />
      </span>
      {showWord && <span>Rocket</span>}
    </span>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

export default Logo;