import { describe, expect, it } from "vitest";
import { resolveAccess } from "@/lib/permissions";

describe("resolveAccess", () => {
  it("allows the owner to view, edit, rename, and share", () => {
    const result = resolveAccess({
      currentUserId: "user-1",
      ownerId: "user-1",
      sharedPermission: null,
    });
    expect(result.isOwner).toBe(true);
    expect(result.canView).toBe(true);
    expect(result.canEdit).toBe(true);
    expect(result.canRename).toBe(true);
    expect(result.canShare).toBe(true);
  });

  it("allows a shared user with edit permission to edit, but not rename or share", () => {
    const result = resolveAccess({
      currentUserId: "user-2",
      ownerId: "user-1",
      sharedPermission: "edit",
    });
    expect(result.isOwner).toBe(false);
    expect(result.canView).toBe(true);
    expect(result.canEdit).toBe(true);
    expect(result.canRename).toBe(false);
    expect(result.canShare).toBe(false);
  });

  it("prevents a view-only user from editing", () => {
    const result = resolveAccess({
      currentUserId: "user-2",
      ownerId: "user-1",
      sharedPermission: "view",
    });
    expect(result.canView).toBe(true);
    expect(result.canEdit).toBe(false);
    expect(result.canRename).toBe(false);
  });

  it("blocks an unshared user from viewing or editing", () => {
    const result = resolveAccess({
      currentUserId: "user-3",
      ownerId: "user-1",
      sharedPermission: null,
    });
    expect(result.canView).toBe(false);
    expect(result.canEdit).toBe(false);
    expect(result.isOwner).toBe(false);
  });
});
