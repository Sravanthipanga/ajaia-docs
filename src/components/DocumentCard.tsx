"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import type { DocumentWithAccess } from "@/types";

export default function DocumentCard({ doc }: { doc: DocumentWithAccess }) {
  const updated = formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true });
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
    >
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="truncate font-medium text-slate-900">{doc.title}</h3>
          <p className="mt-1 text-sm text-slate-500">Updated {updated}</p>
          <p className="mt-2">
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
        </div>
      </div>
    </Link>
  );
}
