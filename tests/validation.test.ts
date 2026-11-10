import { describe, expect, it } from "vitest";
import {
  markdownToTiptap,
  textToTiptap,
  titleFromFilename,
  validateImportFile,
  validateTitle,
} from "@/lib/validation";

describe("validateImportFile", () => {
  it("accepts .txt files", () => {
    expect(validateImportFile({ name: "notes.txt", size: 100, text: "hello" })).toEqual({
      ok: true,
      extension: ".txt",
    });
  });

  it("accepts .md files", () => {
    expect(validateImportFile({ name: "notes.md", size: 100, text: "# Hi" })).toEqual({
      ok: true,
      extension: ".md",
    });
  });

  it("rejects .exe files", () => {
    const result = validateImportFile({ name: "notes.exe", size: 100, text: "hello" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Only .txt and .md files are supported.");
    }
  });

  it("rejects files larger than 1 MB", () => {
    const result = validateImportFile({
      name: "big.txt",
      size: 1_048_577,
      text: "x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("The selected file exceeds the 1 MB limit.");
    }
  });

  it("rejects empty files", () => {
    const result = validateImportFile({ name: "empty.txt", size: 0, text: "" });
    expect(result.ok).toBe(false);
  });
});

describe("validateTitle", () => {
  it("rejects a blank title", () => {
    expect(validateTitle("   ").ok).toBe(false);
  });

  it("rejects a title over 120 characters", () => {
    expect(validateTitle("a".repeat(121)).ok).toBe(false);
  });

  it("accepts a normal title and trims it", () => {
    const result = validateTitle("  Project Proposal  ");
    expect(result.ok).toBe(true);
    expect(result.value).toBe("Project Proposal");
  });
});

describe("markdownToTiptap", () => {
  it("converts headings, bullet lists, and paragraphs", () => {
    const doc = markdownToTiptap("# Title\n\nHello\n\n- one\n- two");
    expect(doc.content?.[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
    });
    expect(doc.content?.some((n) => n.type === "bulletList")).toBe(true);
  });

  it("converts plain text into paragraphs", () => {
    const doc = textToTiptap("first line\nsecond line");
    expect(doc.content).toHaveLength(2);
    expect(doc.content?.[0].type).toBe("paragraph");
  });
});

describe("titleFromFilename", () => {
  it("uses the filename without the extension as the title", () => {
    expect(titleFromFilename("Project Proposal.md")).toBe("Project Proposal");
    expect(titleFromFilename("notes.txt")).toBe("notes");
  });
});
