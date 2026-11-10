import type { DocumentAccess } from "@/types";

export type ResolveAccessInput = {
  currentUserId: string;
  ownerId: string;
  sharedPermission: "view" | "edit" | null;
};

/**
 * Single source of truth for document access. The API routes and
 * data layer enforce this; the UI only hides buttons based on it.
 *
 * Owner: view, edit content, rename, share, delete.
 * Shared editor: view and edit content (no rename / share / delete).
 * Shared viewer: view only.
 * Unshared user: no access.
 */
export function resolveAccess(input: ResolveAccessInput): DocumentAccess {
  const isOwner = input.currentUserId === input.ownerId;
  if (isOwner) {
    return {
      isOwner: true,
      canView: true,
      canEdit: true,
      canRename: true,
      canShare: true,
      sharedPermission: null,
    };
  }
  if (input.sharedPermission === "edit") {
    return {
      isOwner: false,
      canView: true,
      canEdit: true,
      canRename: false,
      canShare: false,
      sharedPermission: "edit",
    };
  }
  if (input.sharedPermission === "view") {
    return {
      isOwner: false,
      canView: true,
      canEdit: false,
      canRename: false,
      canShare: false,
      sharedPermission: "view",
    };
  }
  return {
    isOwner: false,
    canView: false,
    canEdit: false,
    canRename: false,
    canShare: false,
    sharedPermission: null,
  };
}
