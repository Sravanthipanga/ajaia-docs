import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DocumentCard from "@/components/DocumentCard";
import { EMPTY_DOCUMENT_CONTENT, type DocumentWithAccess } from "@/types";

const ownedDoc: DocumentWithAccess = {
  id: "doc-1",
  title: "Project Proposal",
  content: EMPTY_DOCUMENT_CONTENT,
  owner_id: "11111111-1111-1111-1111-111111111111",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner: { id: "11111111-1111-1111-1111-111111111111", name: "Avery Johnson", email: "avery@example.com" },
  access: {
    isOwner: true,
    canView: true,
    canEdit: true,
    canRename: true,
    canShare: true,
    sharedPermission: null,
  },
};

describe("DocumentCard", () => {
  it("shows the document title and ownership badge", () => {
    render(<DocumentCard doc={ownedDoc} />);
    expect(screen.getByText("Project Proposal")).toBeInTheDocument();
    expect(screen.getByText("Owned by you")).toBeInTheDocument();
  });
});
