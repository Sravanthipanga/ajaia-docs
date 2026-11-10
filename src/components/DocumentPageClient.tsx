"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import DocumentEditor from "@/components/editor/DocumentEditor";
import ShareDialog from "@/components/ShareDialog";
import UserSwitcher, { useCurrentUser } from "@/components/UserSwitcher";
import { validateTitle } from "@/lib/validation";
import type { DocumentWithAccess, SaveStatus, TiptapContent } from "@/types";

export default function DocumentPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [currentUser, switchUser] = useCurrentUser();
  const [doc, setDoc] = useState<DocumentWithAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}?userId=${currentUser.id}`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 404) {
        setError("Document not found.");
        setDoc(null);
        return;
      }
      if (res.status === 403) {
        setError("Access denied — this document has not been shared with you.");
        setDoc(null);
        return;
      }
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Could not load the document.",
        );
        return;
      }
      const loaded = (data as { document: DocumentWithAccess }).document;
      setDoc(loaded);
      setTitle(loaded.title);
      lastSavedContent.current = JSON.stringify(loaded.content);
    } catch {
      setError("Could not load the document. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser.id]);

  // Initial server fetch — the legitimate use of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function saveContent(content: TiptapContent) {
    if (!doc) return;
    const serialized = JSON.stringify(content);
    if (serialized === lastSavedContent.current) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, content }),
      });
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      lastSavedContent.current = serialized;
      setSaveStatus("saved");
      setSavedAt(new Date());
    } catch {
      setSaveStatus("error");
    }
  }

  function handleContentChange(content: TiptapContent) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveContent(content), 800);
  }

  async function saveTitle(nextTitle: string) {
    const checked = validateTitle(nextTitle);
    if (!checked.ok || !checked.value) {
      setTitleError(checked.error ?? "Invalid title.");
      if (doc) setTitle(doc.title);
      return;
    }
    if (checked.value === doc?.title) {
      setTitleError(null);
      return;
    }
    setTitleError(null);
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, title: checked.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveStatus("error");
        setTitleError(
          (data as { error?: string }).error ?? "Could not rename the document.",
        );
        if (doc) setTitle(doc.title);
        return;
      }
      setTitle(checked.value);
      setDoc((data as { document: DocumentWithAccess }).document);
      setSaveStatus("saved");
      setSavedAt(new Date());
    } catch {
      setSaveStatus("error");
    }
  }

  async function deleteDocument() {
    if (!doc) return;
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${id}?userId=${currentUser.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("Could not delete the document.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-4xl space-y-3" aria-label="Loading document">
          <div className="h-8 w-64 animate-pulse rounded bg-white" />
          <div className="h-[500px] animate-pulse rounded-lg bg-white" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-2xl rounded-lg border bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            {error ?? "Document not found."}
          </h1>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            ← Back to My Documents
          </Link>
        </div>
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "error"
        ? "Unable to save. Retry"
        : saveStatus === "saved" && savedAt
          ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
          : "";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </Link>
          <UserSwitcher currentUser={currentUser} onSwitch={switchUser} />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <input
            aria-label="Document title"
            value={title}
            disabled={!doc.access.canRename}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveTitle(title)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            maxLength={120}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-2xl font-bold text-slate-900 hover:border-slate-300 focus:border-blue-500 focus:outline-none disabled:opacity-70"
          />
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={`text-sm ${saveStatus === "error" ? "text-red-600" : "text-green-700"}`}
            >
              {saveLabel}
            </span>
            {doc.access.canShare ? (
              <button
                type="button"
                onClick={() => setShowShare(true)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Share2 size={16} aria-hidden="true" /> Share
              </button>
            ) : null}
            {doc.access.isOwner ? (
              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteDocument()}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} aria-hidden="true" /> Delete
              </button>
            ) : null}
          </div>
        </div>
        {titleError ? (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {titleError}
          </p>
        ) : null}
        <p className="mb-4">
          {doc.access.isOwner ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              Owned by you
            </span>
          ) : (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Owned by {doc.owner?.name ?? "someone else"}
              {doc.access.sharedPermission === "edit" ? " · Can edit" : " · Can view"}
            </span>
          )}
        </p>
        {saveStatus === "error" ? (
          <button
            type="button"
            onClick={() => void load()}
            className="mb-3 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Retry save
          </button>
        ) : null}
        <DocumentEditor
          initialContent={doc.content}
          editable={doc.access.canEdit}
          onChange={handleContentChange}
        />
        {!doc.access.canEdit ? (
          <p className="mt-3 text-sm text-slate-500">
            You have view-only access to this document.
          </p>
        ) : null}
      </main>
      {showShare ? (
        <ShareDialog
          doc={doc}
          currentUser={currentUser}
          onClose={() => setShowShare(false)}
          onShared={() => void load()}
        />
      ) : null}
    </div>
  );
}
