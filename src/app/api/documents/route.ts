import { NextResponse } from "next/server";
import { createDocument, listDocumentsForUser, listUsers } from "@/lib/store";
import { validateTitle } from "@/lib/validation";
import { documentContentSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }
    const users = await listUsers();
    if (!users.some((u) => u.id === userId)) {
      return NextResponse.json({ error: "Active user must exist." }, { status: 400 });
    }
    const { owned, shared } = await listDocumentsForUser(userId);
    return NextResponse.json({ owned, shared, users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load documents." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { title, ownerId, content } = body as {
      title?: unknown;
      ownerId?: unknown;
      content?: unknown;
    };
    if (typeof ownerId !== "string" || ownerId.trim() === "") {
      return NextResponse.json({ error: "ownerId is required." }, { status: 400 });
    }
    const checked = validateTitle(title ?? "Untitled Document");
    if (!checked.ok || !checked.value) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    let parsedContent;
    if (content !== undefined) {
      const parsed = documentContentSchema.safeParse(content);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid document content." }, { status: 400 });
      }
      parsedContent = parsed.data;
    }
    const doc = await createDocument({
      title: checked.value,
      ownerId,
      content: parsedContent,
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the document." },
      { status: 500 },
    );
  }
}
