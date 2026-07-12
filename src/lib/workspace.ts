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

function normalizeWorkspace(data: any): Workspace | null {
  if (!data?.id) return null;
  return {
    id: data.id,
    name: data.name || "Workspace",
    is_personal: !!data.is_personal,
    role: data.role,
  };
}

function extractWorkspace(data: any): Workspace | null {
  if (Array.isArray(data)) return normalizeWorkspace(data[0]);
  return normalizeWorkspace(data);
}

export function getActiveWorkspaceIdSync(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

export function setActiveWorkspaceId(id: string) {
  try { localStorage.setItem(LS_KEY, id); } catch (_error) { return; }
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

export async function createWorkspace(
  name: string,
  opts?: { isPersonal?: boolean; userId?: string | null },
): Promise<Workspace> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workspace name is required");

  const isPersonal = !!opts?.isPersonal;
  const rpcName = trimmed;

  try {
    const { data, error } = await sb.functions.invoke("create-workspace", {
      body: { name: trimmed, is_personal: isPersonal },
    });
    if (!error) {
      const ws = extractWorkspace(data);
      if (ws) return ws;
    }
  } catch (_error) {
    // fall through
  }

  if (!isPersonal) {
    const { data, error } = await sb.rpc("create_workspace", { _name: rpcName });
    if (!error) {
      const ws = extractWorkspace(data);
      if (ws) return ws;
    }
  }

  if (opts?.userId) {
    const { data, error } = await sb
      .from("workspaces")
      .insert({ name: trimmed, owner_id: opts.userId, is_personal: isPersonal })
      .select("id,name,is_personal")
      .single();
    if (!error && data?.id) {
      const { error: memberError } = await sb
        .from("workspace_members")
        .insert({ workspace_id: data.id, user_id: opts.userId, role: "owner" });
      if (memberError && !/duplicate key|already exists/i.test(memberError.message || "")) {
        throw memberError;
      }
      const ws = extractWorkspace(data);
      if (ws) return ws;
    }
    if (error && !/row-level security|policy/i.test(error.message || "")) {
      throw error;
    }
  }

  throw new Error(
    isPersonal
      ? "Rocket couldn't create your personal workspace yet. Please refresh and try again."
      : "Rocket couldn't create this workspace yet. Please refresh and try again.",
  );
}

async function ensurePersonalWorkspace(): Promise<string | null> {
  const { data: authData } = await sb.auth.getUser();
  const user = authData?.user;
  if (!user) return null;
  const baseName = (user.user_metadata?.full_name || user.email?.split("@")[0] || "Personal").trim();
  const label = /personal/i.test(baseName) ? baseName : `${baseName} Personal`;
  try {
    const ws = await createWorkspace(label, { isPersonal: true, userId: user.id });
    invalidateWorkspacesCache();
    cachedList = [ws, ...(cachedList || []).filter((item) => item.id !== ws.id)];
    setActiveWorkspaceId(ws.id);
    return ws.id;
  } catch {
    return null;
  }
}

export async function ensureActiveWorkspaceId(): Promise<string | null> {
  const existing = getActiveWorkspaceIdSync();
  const list = await listWorkspaces();
  if (existing && list.some(w => w.id === existing)) return existing;
  const first = list[0]?.id || null;
  if (first) setActiveWorkspaceId(first);
  if (first) return first;
  return ensurePersonalWorkspace();
}

export function invalidateWorkspacesCache() {
  cachedList = null;
}

/** Sugar for inserts. Returns { workspace_id } (or {} if not resolved). */
export async function withWorkspace<T extends object>(row: T): Promise<T & { workspace_id?: string }> {
  const id = await ensureActiveWorkspaceId();
  return id ? { ...row, workspace_id: id } : row;
}
