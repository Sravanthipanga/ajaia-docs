"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Redo,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";

function ToolbarButton({
  label,
  title,
  active,
  disabled,
  onClick,
}: {
  label: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const editable = editor.isEditable;
  const chain = () => editor.chain().focus();
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
      <ToolbarButton
        label={<Bold size={16} />}
        title="Bold"
        active={editor.isActive("bold")}
        disabled={!editable}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolbarButton
        label={<Italic size={16} />}
        title="Italic"
        active={editor.isActive("italic")}
        disabled={!editable}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolbarButton
        label={<UnderlineIcon size={16} />}
        title="Underline"
        active={editor.isActive("underline")}
        disabled={!editable}
        onClick={() => chain().toggleUnderline().run()}
      />
      <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
      <ToolbarButton
        label={<Heading1 size={16} />}
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        disabled={!editable}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label={<Heading2 size={16} />}
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={!editable}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label={<Pilcrow size={16} />}
        title="Paragraph"
        active={editor.isActive("paragraph")}
        disabled={!editable}
        onClick={() => chain().setParagraph().run()}
      />
      <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
      <ToolbarButton
        label={<List size={16} />}
        title="Bullet list"
        active={editor.isActive("bulletList")}
        disabled={!editable}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        label={<ListOrdered size={16} />}
        title="Ordered list"
        active={editor.isActive("orderedList")}
        disabled={!editable}
        onClick={() => chain().toggleOrderedList().run()}
      />
      <span className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
      <ToolbarButton
        label={<Undo size={16} />}
        title="Undo"
        disabled={!editable || !editor.can().undo()}
        onClick={() => chain().undo().run()}
      />
      <ToolbarButton
        label={<Redo size={16} />}
        title="Redo"
        disabled={!editable || !editor.can().redo()}
        onClick={() => chain().redo().run()}
      />
    </div>
  );
}
