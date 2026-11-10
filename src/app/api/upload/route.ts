import { NextResponse } from "next/server";
import { createDocument } from "@/lib/store";
import {
  markdownToTiptap,
  textToTiptap,
  titleFromFilename,
  validateImportFile,
  validateTitle,
} from "@/lib/validation";

/**
 * Import endpoint. The client reads the file with file.text() and
 * posts { filename, text, ownerId }; the server validates extension,
 * size (1 MB, measured on the text bytes), and emptiness, converts
 * .md with basic Markdown parsing and .txt as plain paragraphs, and
 * creates a new document titled from the filename.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { filename, text, ownerId } = body as {
    filename?: unknown;
    text?: unknown;
    ownerId?: unknown;
  };
  if (typeof filename !== "string" || typeof text !== "string") {
    return NextResponse.json(
      { error: "filename and text are required." },
      { status: 400 },
    );
  }
  if (typeof ownerId !== "string" || ownerId.trim() === "") {
    return NextResponse.json({ error: "ownerId is required." }, { status: 400 });
  }
  const size = new TextEncoder().encode(text).length;
  const checked = validateImportFile({ name: filename, size, text });
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }
  const titleChecked = validateTitle(titleFromFilename(filename));
  const title = titleChecked.ok && titleChecked.value ? titleChecked.value : "Untitled Document";
  try {
    const doc = await createDocument({
      title,
      ownerId,
      content: checked.extension === ".md" ? markdownToTiptap(text) : textToTiptap(text),
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "We could not import this file. Please try again.",
      },
      { status: 500 },
    );
  }
}
