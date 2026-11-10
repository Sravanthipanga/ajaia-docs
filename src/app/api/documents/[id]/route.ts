import { NextResponse } from "next/server";
import { deleteDocument, getDocument, updateDocument } from "@/lib/store";
import { documentContentSchema, validateTitle } from "@/lib/validation";
import type { TiptapContent } from "@/types";

type Context = { params: Promise<{ id: string }> };

function userIdFrom(request: Request): string | null {
  return new URL(request.url).searchParams.get("userId");
}

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  const userId = userIdFrom(request);
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const result = await getDocument(id, userId);
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "You do not have access to this document." },
      { status: 403 },
    );
  }
  return NextResponse.json({ document: result.document });
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { userId, title, content } = body as {
    userId?: unknown;
    title?: unknown;
    content?: unknown;
  };
  if (typeof userId !== "string" || userId.trim() === "") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const patch: { title?: string; content?: TiptapContent } = {};
  if (title !== undefined) {
    const checked = validateTitle(title);
    if (!checked.ok || !checked.value) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    patch.title = checked.value;
  }
  if (content !== undefined) {
    const parsed = documentContentSchema.safeParse(content);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document content." }, { status: 400 });
    }
    patch.content = parsed.data as TiptapContent;
  }
  if (patch.title === undefined && patch.content === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  try {
    const result = await updateDocument(id, userId, patch);
    if (result.status === "not_found") {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }
    if (result.status === "forbidden") {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }
    return NextResponse.json({ document: result.document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the document." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  const userId = userIdFrom(request);
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const result = await deleteDocument(id, userId);
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "Only the owner can delete this document." },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true });
}
