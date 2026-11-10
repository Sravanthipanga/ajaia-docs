import { NextResponse } from "next/server";
import { addShare, removeShare } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { documentId, userId, permission, actorId } = body as {
    documentId?: unknown;
    userId?: unknown;
    permission?: unknown;
    actorId?: unknown;
  };
  if (
    typeof documentId !== "string" ||
    typeof userId !== "string" ||
    typeof actorId !== "string"
  ) {
    return NextResponse.json(
      { error: "documentId, userId, and actorId are required." },
      { status: 400 },
    );
  }
  if (permission !== "view" && permission !== "edit") {
    return NextResponse.json(
      { error: "Permission must be 'view' or 'edit'." },
      { status: 400 },
    );
  }
  try {
    const result = await addShare({
      documentId,
      targetUserId: userId,
      permission,
      actorId,
    });
    if (result.status === "not_found") {
      return NextResponse.json({ error: "Document or user not found." }, { status: 404 });
    }
    if (result.status === "forbidden") {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }
    if (result.status === "duplicate") {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }
    return NextResponse.json({ share: result.share }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not share the document." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const params = new URL(request.url).searchParams;
  const documentId = params.get("documentId");
  const userId = params.get("userId");
  const actorId = params.get("actorId");
  if (!documentId || !userId || !actorId) {
    return NextResponse.json(
      { error: "documentId, userId, and actorId are required." },
      { status: 400 },
    );
  }
  const result = await removeShare({ documentId, targetUserId: userId, actorId });
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "Only the owner can change sharing." },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true });
}
