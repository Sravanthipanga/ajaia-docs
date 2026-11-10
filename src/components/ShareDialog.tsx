"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SEEDED_USERS } from "@/lib/seed";
import type { DocumentWithAccess, User } from "@/types";

export default function ShareDialog({
  doc,
  currentUser,
  onClose,
  onShared,
}: {
  doc: DocumentWithAccess;
  currentUser: User;
  onClose: () => void;
  onShared: () => void;
}) {
  const others = SEEDED_USERS.filter((u) => u.id !== doc.owner_id);
  const [targetId, setTargetId] = useState(others[0]?.id ?? "");
  const [permission, setPermission] = useState<"view" | "edit">("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function share() {
    setError(null);
    setMessage(null);
    if (!targetId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          userId: targetId,
          permission,
          actorId: currentUser.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ?? "Could not share this document.",
        );
        return;
      }
      const target = SEEDED_USERS.find((u) => u.id === targetId);
      setMessage(`Shared with ${target?.name ?? "user"} (${permission}).`);
      onShared();
    } finally {
      setBusy(false);
    }
  }

  async function removeShare(userId: string) {
    setError(null);
    await fetch(
      `/api/shares?documentId=${doc.id}&userId=${userId}&actorId=${currentUser.id}`,
      { method: "DELETE" },
    );
    onShared();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${doc.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Share &ldquo;{doc.title}&rdquo;</h2>
          <button
            type="button"
            aria-label="Close share dialog"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Owner: {doc.owner?.name ?? "Unknown"}
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Grant access to:
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              {others.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Permission:
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "view" | "edit")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
          </label>
        </div>
        {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !targetId}
            onClick={() => void share()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Sharing…" : "Share"}
          </button>
        </div>
        {doc.shares && doc.shares.length > 0 ? (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-medium text-slate-700">Shared with</h3>
            <ul className="mt-2 space-y-2">
              {doc.shares.map((share) => (
                <li key={share.id} className="flex items-center justify-between text-sm">
                  <span>
                    {share.user?.name ?? share.user_id} · {share.permission}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeShare(share.user_id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
