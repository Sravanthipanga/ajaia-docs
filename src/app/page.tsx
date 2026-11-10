"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import DocumentList from "@/components/DocumentList";
import FileImport from "@/components/FileImport";
import UserSwitcher, { useCurrentUser } from "@/components/UserSwitcher";
import type { DocumentWithAccess, User } from "@/types";

export default function Home() {
  const [currentUser, switchUser] = useCurrentUser();
  const router = useRouter();
  const [owned, setOwned] = useState<DocumentWithAccess[]>([]);
  const [shared, setShared] = useState<DocumentWithAccess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents?userId=${userId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Could not load documents.",
        );
        return;
      }
      setOwned((data as { owned: DocumentWithAccess[] }).owned ?? []);
      setShared((data as { shared: DocumentWithAccess[] }).shared ?? []);
      setUsers((data as { users: User[] }).users ?? []);
    } catch {
      setError("Could not load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial server fetch — the legitimate use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(currentUser.id);
  }, [currentUser.id, load]);

  async function createDocument() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document", ownerId: currentUser.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Could not create the document.",
        );
        return;
      }
      router.push(`/documents/${(data as { document: { id: string } }).document.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">Ajaia Docs</h1>
          <div className="flex flex-wrap items-center gap-3">
            <UserSwitcher currentUser={currentUser} onSwitch={switchUser} />
            <FileImport currentUser={currentUser} />
            <button
              type="button"
              disabled={creating}
              onClick={() => void createDocument()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} aria-hidden="true" />
              {creating ? "Creating…" : "New Document"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {error ? (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {loading ? (
          <div className="space-y-3" aria-label="Loading documents">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        ) : (
          <>
            <DocumentList
              title="My Documents"
              documents={owned}
              emptyMessage="You have no documents yet. Create one or import a .txt or .md file."
            />
            <DocumentList
              title="Shared With Me"
              documents={shared}
              emptyMessage="No documents have been shared with you yet."
            />
          </>
        )}
        <p className="text-xs text-slate-500">
          Signed in as {currentUser.name} ({currentUser.email}). Authentication is
          simulated with seeded users — switch users above to see sharing.{" "}
          {users.length > 0 ? `Users in this workspace: ${users.map((u) => u.name).join(", ")}.` : ""}
        </p>
      </main>
    </div>
  );
}
