import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, MessageCircle, MessageSquare, Facebook, Send, Copy, Link as LinkIcon, FileText, Image as ImageIcon, Cloud, Lock } from "lucide-react";

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type Asset = {
  id: string;
  title: string;
  content?: string | null;
  image_url?: string | null;
  asset_type?: string;
  share_token?: string | null;
};

export default function ShareExportModal({
  open, onOpenChange, asset, onCreateShareLink,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: Asset;
  onCreateShareLink: () => Promise<string | null>;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const existingUrl = asset.share_token ? `${window.location.origin}/share/asset/${asset.share_token}` : null;
  const isImage = !!asset.image_url;

  const ensureLink = async (): Promise<string | null> => {
    if (existingUrl) return existingUrl;
    setBusy(true);
    try { return await onCreateShareLink(); } finally { setBusy(false); }
  };

  const shareText = `${asset.title}${asset.content ? `\n\n${asset.content.slice(0, 200)}${asset.content.length > 200 ? "…" : ""}` : ""}`;

  const openShare = async (kind: "facebook" | "twitter" | "whatsapp" | "imessage" | "email" | "messenger") => {
    const url = await ensureLink();
    if (!url) { toast({ title: "Couldn't create share link", variant: "destructive" }); return; }
    const enc = encodeURIComponent;
    const text = enc(shareText);
    const u = enc(url);
    let target = "";
    switch (kind) {
      case "facebook": target = `https://www.facebook.com/sharer/sharer.php?u=${u}`; break;
      case "twitter": target = `https://twitter.com/intent/tweet?text=${text}&url=${u}`; break;
      case "whatsapp": target = `https://wa.me/?text=${text}%20${u}`; break;
      case "imessage": target = `sms:&body=${text}%20${url}`; break;
      case "email": target = `mailto:?subject=${enc(asset.title)}&body=${text}%0A%0A${u}`; break;
      case "messenger": target = `https://www.facebook.com/dialog/send?link=${u}&app_id=140586622674265&redirect_uri=${u}`; break;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    const url = await ensureLink();
    if (!url) return;
    if (navigator.share) {
      try { await navigator.share({ title: asset.title, text: shareText, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); } catch {}
    }
  };

  const copyLink = async () => {
    const url = await ensureLink();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  const downloadText = () => {
    const blob = new Blob([asset.content || ""], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${asset.title.replace(/[^a-z0-9-_]+/gi, "-")}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cloudPlaceholder = (name: string) => () => {
    toast({ title: `${name} export coming soon`, description: "Needs per-user OAuth connection." });
  };

  const Tile = ({ Icon, label, onClick, disabled, iconClass }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-3 text-center text-neutral-800 transition hover:border-brand hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClass || "bg-neutral-100 text-neutral-700"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[11px] font-medium text-neutral-800">{label}</div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-neutral-900 border-neutral-200">
        <DialogHeader><DialogTitle>Share & export</DialogTitle></DialogHeader>

        {existingUrl && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
            <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />
            <span className="flex-1 truncate font-mono text-emerald-900">{existingUrl}</span>
            <button onClick={copyLink} className="rounded-md border border-emerald-300 bg-white px-2 py-1 hover:bg-emerald-100">Copy</button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Share</h3>
            <button onClick={nativeShare} className="text-xs text-brand hover:underline">System share…</button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            <Tile Icon={LinkIcon} label="Copy link" onClick={copyLink} />
            <Tile Icon={XLogo} label="X" onClick={() => openShare("twitter")} iconClass="bg-neutral-900 text-white" />
            <Tile Icon={Facebook} label="Facebook" onClick={() => openShare("facebook")} iconClass="bg-blue-600 text-white" />
            <Tile Icon={Send} label="Messenger" onClick={() => openShare("messenger")} iconClass="bg-gradient-to-br from-purple-500 to-pink-500 text-white" />
            <Tile Icon={MessageCircle} label="WhatsApp" onClick={() => openShare("whatsapp")} iconClass="bg-green-500 text-white" />
            <Tile Icon={MessageSquare} label="iMessage" onClick={() => openShare("imessage")} iconClass="bg-green-400 text-white" />
            <Tile Icon={Mail} label="Email" onClick={() => openShare("email")} iconClass="bg-neutral-100 text-neutral-700" />
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">Instagram / TikTok / YouTube don't allow direct web-share — use the system share sheet on mobile.</p>
        </div>

        <div className="mt-2">
          <h3 className="mb-2 text-sm font-semibold">Save</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {isImage ? (
              <a href={asset.image_url!} download={`${asset.title}.png`} className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white p-3 text-center text-neutral-800 hover:border-brand hover:bg-neutral-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"><ImageIcon className="h-5 w-5" /></div>
                <div className="text-[11px] font-medium text-neutral-800">Download PNG</div>
              </a>
            ) : (
              <Tile Icon={FileText} label="Download .md" onClick={downloadText} iconClass="bg-neutral-100 text-neutral-700" />
            )}
            <Tile Icon={Copy} label="Copy text" onClick={() => { navigator.clipboard.writeText(asset.content || ""); toast({ title: "Copied" }); }} disabled={isImage} iconClass="bg-neutral-100 text-neutral-700" />
            <Tile Icon={Cloud} label="Google Drive" onClick={cloudPlaceholder("Google Drive")} iconClass="bg-amber-50 text-amber-600" />
            <Tile Icon={Cloud} label="OneDrive" onClick={cloudPlaceholder("OneDrive")} iconClass="bg-blue-50 text-blue-600" />
            <Tile Icon={Cloud} label="Dropbox" onClick={cloudPlaceholder("Dropbox")} iconClass="bg-sky-50 text-sky-600" />
            <Tile Icon={Cloud} label="Box" onClick={cloudPlaceholder("Box")} iconClass="bg-blue-50 text-blue-700" />
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500"><Lock className="h-3 w-3" /> Cloud destinations need per-user OAuth — coming soon.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}