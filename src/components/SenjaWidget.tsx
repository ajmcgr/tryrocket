import { useEffect } from "react";

const SCRIPT_SRC =
  "https://widget.senja.io/widget/fddaae27-ef94-4488-b97e-ad90a0e0192d/platform.js";

export default function SenjaWidget() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.type = "text/javascript";
    document.body.appendChild(s);
  }, []);

  return (
    <div
      className="senja-embed"
      data-id="fddaae27-ef94-4488-b97e-ad90a0e0192d"
      data-mode="shadow"
      data-lazyload="false"
      style={{ display: "inline-block", width: "auto", whiteSpace: "nowrap" }}
    />
  );
}