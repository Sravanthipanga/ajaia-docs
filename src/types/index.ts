export type User = {
  id: string;
  name: string;
  email: string;
  created_at?: string;
};

export type TiptapContent = {
  type: "doc";
  content?: Array<Record<string, unknown>>;
};

export type Document = {
  id: string;
  title: string;
  content: TiptapContent;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type DocumentShare = {
  id: string;
  document_id: string;
  user_id: string;
  permission: "view" | "edit";
  created_at: string;
};

export type DocumentAccess = {
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canRename: boolean;
  canShare: boolean;
  sharedPermission: "view" | "edit" | null;
};

export type DocumentWithAccess = Document & {
  owner: User | null;
  access: DocumentAccess;
  shares?: Array<DocumentShare & { user: User | null }>;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const EMPTY_DOCUMENT_CONTENT: TiptapContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
