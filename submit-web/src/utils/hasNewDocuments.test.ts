import { describe, expect, it } from "vitest";
import { SubmissionPackage } from "@/models/Package";
import { hasNewDocuments } from "./hasNewDocuments";

const build = (
  submissions: Array<Record<string, unknown>>,
): SubmissionPackage =>
  ({ items: [{ submissions }] }) as unknown as SubmissionPackage;

describe("hasNewDocuments", () => {
  it("returns true when a PENDING document exists", () => {
    const pkg = build([
      { type: "DOCUMENT", status: "SUBMITTED", submitted_document_id: 1 },
      { type: "DOCUMENT", status: "PENDING", submitted_document_id: 2 },
    ]);
    expect(hasNewDocuments(pkg)).toBe(true);
  });

  it("returns false when all documents are already submitted", () => {
    const pkg = build([
      { type: "DOCUMENT", status: "SUBMITTED", submitted_document_id: 1 },
    ]);
    expect(hasNewDocuments(pkg)).toBe(false);
  });

  it("ignores pending submissions that are not documents", () => {
    const pkg = build([{ type: "FORM", status: "PENDING" }]);
    expect(hasNewDocuments(pkg)).toBe(false);
  });
});
