import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
const LS_KEY = "rocket.active_workspace_id";

export type Workspace = {
  id: string;
  name: string;
  is_personal?: boolean;
  role?: "owner" | "admin" | "editor" | "viewer";
};

let cachedList: Workspace[] | null = null;
let inflight: Promise<Workspace[]> | null = null;

export function getActiveWorkspaceIdSync(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

export function setActiveWorkspaceId(id: string) {
  try { localStorage.setItem(LS_KEY, id); } catch {}
  window.dispatchEvent(new CustomEvent("workspace:changed", { detail: { id } }));
}

export async function listWorkspaces(force = false): Promise<Workspace[]> {
  if (!force && cachedList) return cachedList;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data: memberships } = await sb
      .from("workspace_members")
      .select("role, workspace_id, workspaces(id, name, is_personal)")
      .order("created_at", { ascending: true });
    const list: Workspace[] = (memberships || [])
      .map((m: any) => m.workspaces ? {
        id: m.workspaces.id,
        name: m.workspaces.name,
        is_personal: m.workspaces.is_personal,
        role: m.role,
      } : null)
      .filter(Boolean) as Workspace[];
    // Personal first
    list.sort((a, b) => (b.is_personal ? 1 : 0) - (a.is_personal ? 1 : 0));
    cachedList = list;
    return list;
  })();
  try { return await inflight; } finally { inflight = null; }
}

export async function ensureActiveWorkspaceId(): Promise<string | null> {
  const existing = getActiveWorkspaceIdSync();
  const list = await listWorkspaces();
  if (existing && list.some(w => w.id === existing)) return existing;
  const first = list[0]?.id || null;
  if (first) setActiveWorkspaceId(first);
  return first;
}

export function invalidateWorkspacesCache() {
  cachedList = null;
}

/** Sugar for inserts. Returns { workspace_id } (or {} if not resolved). */
export async function withWorkspace<T extends object>(row: T): Promise<T & { workspace_id?: string }> {
  const id = await ensureActiveWorkspaceId();
  return id ? { ...row, workspace_id: id } : row;
}