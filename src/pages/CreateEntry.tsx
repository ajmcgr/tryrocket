import { useSearchParams } from "react-router-dom";
import Generate from "./Generate";
import HomeHub from "./HomeHub";

/**
 * Logged-in landing at /create. Shows Brandmark-style hub (Generate /
 * Templates / Icon Designer) on a cold landing, and hands off to the existing
 * Generate flow whenever any generation intent is expressed in the URL.
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
  return <HomeHub />;
};

export default CreateEntry;