import { useSearchParams } from "react-router-dom";
import Generate from "./Generate";
import LogoStudio from "./LogoStudio";

/**
 * Logo-first entry point for /create. Shows the LogoStudio form on a cold
 * landing, and hands off to the existing Generate flow whenever any
 * generation intent is expressed in the URL (prompt/chat/asset_type/etc).
 */
const CreateEntry = () => {
  const [params] = useSearchParams();
  const hasIntent =
    params.get("prompt") ||
    params.get("chat") ||
    params.get("asset_type") ||
    params.get("workflow") ||
    params.get("project") ||
    params.get("direction");
  if (hasIntent) return <Generate />;
  return <LogoStudio />;
};

export default CreateEntry;