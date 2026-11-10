"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { validateImportFile } from "@/lib/validation";
import type { User } from "@/types";

export default function FileImport({ currentUser }: { currentUser: User }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const checked = validateImportFile({ name: file.name, size: file.size });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const rechecked = validateImportFile({ name: file.name, size: file.size, text });
      if (!rechecked.ok) {
        setError(rechecked.error);
        return;
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, text, ownerId: currentUser.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error ??
            "We could not import this file. Please try again.",
        );
        return;
      }
      router.push(`/documents/${(data as { document: { id: string } }).document.id}`);
    } catch {
      setError("We could not import this file. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        className="hidden"
        aria-label="Import a .txt or .md file"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Upload size={16} aria-hidden="true" />
        {busy ? "Importing…" : "Import File"}
      </button>
      <p className="mt-1 text-xs text-slate-500">
        Supported file types: .txt and .md, maximum 1 MB.
      </p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
