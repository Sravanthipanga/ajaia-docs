"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import type { TiptapContent } from "@/types";
import EditorToolbar from "@/components/editor/EditorToolbar";

type Props = {
  initialContent: TiptapContent;
  onChange: (content: TiptapContent) => void;
  editable?: boolean;
};

export default function DocumentEditor({
  initialContent,
  onChange,
  editable = true,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: initialContent,
    editable,
    // Prevents server-side rendering / hydration mismatches in Next.js.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapContent);
    },
  });

  if (!editor) {
    return <div className="rounded-lg border bg-white p-8">Loading editor…</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <EditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-[500px] p-8 prose max-w-none [&_.ProseMirror]:min-h-[460px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold"
      />
    </div>
  );
}
