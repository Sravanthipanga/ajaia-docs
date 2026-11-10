import { Suspense } from "react";
import DocumentPageClient from "@/components/DocumentPageClient";

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 p-8">
          <div className="mx-auto max-w-4xl space-y-3" aria-label="Loading document">
            <div className="h-8 w-64 animate-pulse rounded bg-white" />
            <div className="h-[500px] animate-pulse rounded-lg bg-white" />
          </div>
        </div>
      }
    >
      <DocumentPageClient params={params} />
    </Suspense>
  );
}
