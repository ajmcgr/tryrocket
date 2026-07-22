import { Navigate, useSearchParams } from "react-router-dom";
import Generate from "./Generate";

/**
 * /create is only the generation handoff route. Never show a standalone hub.
 */
const CreateEntry = () => {
  const [params] = useSearchParams();
  const hasGenerationIntent =
    params.get("prompt") ||
    params.get("chat");

  if (hasGenerationIntent) return <Generate />;

  return <Navigate to={params.get("asset_type") === "icon" ? "/icons" : "/logos"} replace />;
};

export default CreateEntry;