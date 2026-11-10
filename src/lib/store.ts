import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveAccess } from "@/lib/permissions";
import { SEEDED_USERS } from "@/lib/seed";
import {
  EMPTY_DOCUMENT_CONTENT,
  type Document,
  type DocumentShare,
  type DocumentWithAccess,
  type TiptapContent,
  type User,
} from "@/types";

/**
 * Data layer.
 *
 * When NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 * every operation below talks to Supabase Postgres (tables users,
 * documents, document_shares — see supabase/schema.sql).
 *
 * When they are not set, the app runs in local demo mode backed by an
 * in-memory store seeded with the two users. Documents created in demo
 * mode persist for the lifetime of the running server (they survive a
 * page refresh, which is what the assessment's save/reopen flow needs)
 * but not across a server restart. This is stated in the README.
 * Permissions are enforced here in both modes, never only in the UI.
 */

type MemoryStore = {
  users: Map<string, User>;
  documents: Map<string, Document>;
  shares: Map<string, DocumentShare>;
  seeded: boolean;
};

declare global {
  var __ajaiaStore: MemoryStore | undefined;
}

function memoryStore(): MemoryStore {
  if (!globalThis.__ajaiaStore) {
    globalThis.__ajaiaStore = {
      users: new Map(SEEDED_USERS.map((u) => [u.id, u])),
      documents: new Map(),
      shares: new Map(),
      seeded: true,
    };
  }
  return globalThis.__ajaiaStore;
}

function toWithAccess(
  doc: Document,
  currentUserId: string,
  users: User[],
  shares: DocumentShare[],
): DocumentWithAccess {
  const share = shares.find(
    (s) => s.document_id === doc.id && s.user_id === currentUserId,
  );
  const access = resolveAccess({
    currentUserId,
    ownerId: doc.owner_id,
    sharedPermission: share ? share.permission : null,
  });
  return {
    ...doc,
    owner: users.find((u) => u.id === doc.owner_id) ?? null,
    access,
    shares: shares
      .filter((s) => s.document_id === doc.id)
      .map((s) => ({
        ...s,
        user: users.find((u) => u.id === s.user_id) ?? null,
      })),
  };
}

export async function listUsers(): Promise<User[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,created_at")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as User[];
  }
  return [...memoryStore().users.values()];
}

export async function listDocumentsForUser(
  userId: string,
): Promise<{ owned: DocumentWithAccess[]; shared: DocumentWithAccess[] }> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: docs, error: docError } = await supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });
    if (docError) throw new Error(docError.message);
    const { data: shares, error: shareError } = await supabase
      .from("document_shares")
      .select("*");
    if (shareError) throw new Error(shareError.message);
    const users = await listUsers();
    const all = ((docs ?? []) as Document[]).map((d) =>
      toWithAccess(d, userId, users, (shares ?? []) as DocumentShare[]),
    );
    return {
      owned: all.filter((d) => d.access.isOwner),
      shared: all.filter((d) => !d.access.isOwner && d.access.canView),
    };
  }
  const store = memoryStore();
  const users = [...store.users.values()];
  const shares = [...store.shares.values()];
  const all = [...store.documents.values()]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((d) => toWithAccess(d, userId, users, shares));
  return {
    owned: all.filter((d) => d.access.isOwner),
    shared: all.filter((d) => !d.access.isOwner && d.access.canView),
  };
}

export async function getDocument(
  id: string,
  userId: string,
): Promise<
  | { status: "ok"; document: DocumentWithAccess }
  | { status: "not_found" }
  | { status: "forbidden"; message: string }
> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return { status: "not_found" };
    const { data: shares } = await supabase
      .from("document_shares")
      .select("*")
      .eq("document_id", id);
    const users = await listUsers();
    const doc = toWithAccess(
      data as Document,
      userId,
      users,
      (shares ?? []) as DocumentShare[],
    );
    if (!doc.access.canView) return { status: "forbidden", message: "You do not have access to this document." };
    return { status: "ok", document: doc };
  }
  const store = memoryStore();
  const doc = store.documents.get(id);
  if (!doc) return { status: "not_found" };
  const users = [...store.users.values()];
  const shares = [...store.shares.values()];
  const withAccess = toWithAccess(doc, userId, users, shares);
  if (!withAccess.access.canView) return { status: "forbidden", message: "You do not have access to this document." };
  return { status: "ok", document: withAccess };
}

export async function createDocument(input: {
  title: string;
  ownerId: string;
  content?: TiptapContent;
}): Promise<Document> {
  const now = new Date().toISOString();
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title: input.title,
        content: input.content ?? EMPTY_DOCUMENT_CONTENT,
        owner_id: input.ownerId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as Document;
  }
  const store = memoryStore();
  if (!store.users.has(input.ownerId)) {
    throw new Error("Active user must exist.");
  }
  const doc: Document = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content ?? EMPTY_DOCUMENT_CONTENT,
    owner_id: input.ownerId,
    created_at: now,
    updated_at: now,
  };
  store.documents.set(doc.id, doc);
  return doc;
}

export async function updateDocument(
  id: string,
  userId: string,
  patch: { title?: string; content?: TiptapContent },
): Promise<
  | { status: "ok"; document: DocumentWithAccess }
  | { status: "not_found" }
  | { status: "forbidden"; message: string }
> {
  const current = await getDocument(id, userId);
  if (current.status !== "ok") return current;
  const access = current.document.access;
  if (patch.title !== undefined && !access.canRename) {
    return { status: "forbidden", message: "Only the owner can rename this document." };
  }
  if (patch.content !== undefined && !access.canEdit) {
    return { status: "forbidden", message: "You do not have edit access to this document." };
  }
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("documents")
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.content !== undefined ? { content: patch.content } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    const refreshed = await getDocument(id, userId);
    if (refreshed.status !== "ok") return refreshed;
    return { status: "ok", document: refreshed.document };
  }
  const store = memoryStore();
  const doc = store.documents.get(id);
  if (!doc) return { status: "not_found" };
  const updated: Document = {
    ...doc,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    updated_at: new Date().toISOString(),
  };
  store.documents.set(id, updated);
  const refreshed = await getDocument(id, userId);
  if (refreshed.status !== "ok") return refreshed;
  return { status: "ok", document: refreshed.document };
}

export async function deleteDocument(
  id: string,
  userId: string,
): Promise<{ status: "ok" } | { status: "not_found" } | { status: "forbidden" }> {
  const current = await getDocument(id, userId);
  if (current.status !== "ok") {
    return current.status === "forbidden" ? { status: "forbidden" } : current;
  }
  if (!current.document.access.isOwner) return { status: "forbidden" };
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { status: "ok" };
  }
  const store = memoryStore();
  store.documents.delete(id);
  for (const [key, share] of store.shares) {
    if (share.document_id === id) store.shares.delete(key);
  }
  return { status: "ok" };
}

export async function addShare(input: {
  documentId: string;
  targetUserId: string;
  permission: "view" | "edit";
  actorId: string;
}): Promise<
  | { status: "ok"; share: DocumentShare }
  | { status: "not_found" }
  | { status: "forbidden"; message: string }
  | { status: "duplicate"; message: string }
> {
  const current = await getDocument(input.documentId, input.actorId);
  if (current.status !== "ok") return current;
  if (!current.document.access.canShare) {
    return { status: "forbidden", message: "Only the owner can share this document." };
  }
  if (input.targetUserId === current.document.owner_id) {
    return { status: "forbidden", message: "You cannot share a document with its owner." };
  }
  const supabase = getSupabase();
  if (supabase) {
    const { data: existing } = await supabase
      .from("document_shares")
      .select("*")
      .eq("document_id", input.documentId)
      .eq("user_id", input.targetUserId)
      .maybeSingle();
    if (existing) {
      return { status: "duplicate", message: "This document is already shared with that user." };
    }
    const { data, error } = await supabase
      .from("document_shares")
      .insert({
        document_id: input.documentId,
        user_id: input.targetUserId,
        permission: input.permission,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { status: "ok", share: data as DocumentShare };
  }
  const store = memoryStore();
  if (!store.users.has(input.targetUserId)) {
    return { status: "not_found" };
  }
  const duplicate = [...store.shares.values()].find(
    (s) => s.document_id === input.documentId && s.user_id === input.targetUserId,
  );
  if (duplicate) {
    return { status: "duplicate", message: "This document is already shared with that user." };
  }
  const share: DocumentShare = {
    id: crypto.randomUUID(),
    document_id: input.documentId,
    user_id: input.targetUserId,
    permission: input.permission,
    created_at: new Date().toISOString(),
  };
  store.shares.set(share.id, share);
  return { status: "ok", share };
}

export async function removeShare(input: {
  documentId: string;
  targetUserId: string;
  actorId: string;
}): Promise<{ status: "ok" } | { status: "not_found" } | { status: "forbidden" }> {
  const current = await getDocument(input.documentId, input.actorId);
  if (current.status !== "ok") {
    return current.status === "forbidden" ? { status: "forbidden" } : current;
  }
  if (!current.document.access.canShare) return { status: "forbidden" };
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("document_shares")
      .delete()
      .eq("document_id", input.documentId)
      .eq("user_id", input.targetUserId);
    if (error) throw new Error(error.message);
    return { status: "ok" };
  }
  const store = memoryStore();
  for (const [key, share] of store.shares) {
    if (share.document_id === input.documentId && share.user_id === input.targetUserId) {
      store.shares.delete(key);
    }
  }
  return { status: "ok" };
}

export function supabaseMode(): "supabase" | "demo" {
  return isSupabaseConfigured() ? "supabase" : "demo";
}
