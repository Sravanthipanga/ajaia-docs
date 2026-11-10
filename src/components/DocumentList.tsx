"use client";

import DocumentCard from "@/components/DocumentCard";
import type { DocumentWithAccess } from "@/types";

export default function DocumentList({
  title,
  documents,
  emptyMessage,
}: {
  title: string;
  documents: DocumentWithAccess[];
  emptyMessage: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {documents.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </section>
  );
}
