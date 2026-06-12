import { Link } from "react-router-dom";
import rocketLogo from "@/assets/rocket-logo-color.png.asset.json";

type Props = { to?: string; size?: "sm" | "md"; className?: string };

const Logo = ({ to = "/", size = "md", className = "" }: Props) => {
  const h = size === "sm" ? "h-8" : "h-11";
  const body = (
    <img src={rocketLogo.url} alt="Rocket" className={`${h} w-auto object-contain ${className}`} />
  );
  return to ? <Link to={to} className="inline-flex items-center">{body}</Link> : body;
};

export default Logo;