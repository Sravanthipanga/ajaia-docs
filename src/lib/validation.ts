import { z } from "zod";
import type { TiptapContent } from "@/types";

export const MAX_TITLE_LENGTH = 120;
export const MAX_IMPORT_BYTES = 1_048_576; // 1 MB
export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".md"] as const;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title must have at least 1 non-space character.")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);

export function validateTitle(title: unknown): {
  ok: boolean;
  value?: string;
  error?: string;
} {
  const result = titleSchema.safeParse(title);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid title." };
  }
  return { ok: true, value: result.data };
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export type ImportValidation =
  | { ok: true; extension: ".txt" | ".md" }
  | { ok: false; error: string };

export function validateImportFile(file: {
  name: string;
  size: number;
  text?: string;
}): ImportValidation {
  const extension = getFileExtension(file.name);
  if (extension !== ".txt" && extension !== ".md") {
    return { ok: false, error: "Only .txt and .md files are supported." };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, error: "The selected file exceeds the 1 MB limit." };
  }
  if (file.size === 0 || (file.text !== undefined && file.text.trim() === "")) {
    return { ok: false, error: "The file is empty." };
  }
  return { ok: true, extension };
}

/** Convert plain text into Tiptap JSON: one paragraph per non-empty line. */
export function textToTiptap(text: string): TiptapContent {
  const lines = text.split(/\r?\n/);
  const content = lines
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    }));
  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

/**
 * Convert simple Markdown into Tiptap JSON. Supports # / ## / ### headings,
 * "- " / "* " bullet lists, "1. " ordered lists, and plain paragraphs.
 * Inline **bold** / *italic* markers are kept as plain text (not parsed),
 * which is documented in the README as a known limitation.
 */
export function markdownToTiptap(markdown: string): TiptapContent {
  const lines = markdown.split(/\r?\n/);
  const content: Array<Record<string, unknown>> = [];
  let bulletItems: Array<Record<string, unknown>> = [];
  let orderedItems: Array<Record<string, unknown>> = [];

  const flushLists = () => {
    if (bulletItems.length > 0) {
      content.push({ type: "bulletList", content: bulletItems });
      bulletItems = [];
    }
    if (orderedItems.length > 0) {
      content.push({ type: "orderedList", content: orderedItems });
      orderedItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") {
      flushLists();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushLists();
      content.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: [{ type: "text", text: heading[2] }],
      });
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (orderedItems.length > 0) flushLists();
      bulletItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: bullet[1] }],
          },
        ],
      });
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (bulletItems.length > 0) flushLists();
      orderedItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: ordered[1] }],
          },
        ],
      });
      continue;
    }
    flushLists();
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    });
  }
  flushLists();

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base === "" ? "Untitled Document" : base.slice(0, MAX_TITLE_LENGTH);
}

export const documentContentSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();
