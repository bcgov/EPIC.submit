import { describe, expect, it } from "vitest";
import { Submission } from "@/models/Submission";
import { orderDocumentsBySortOrder } from "./submissionDocuments";

const doc = (id: number, sort_order: number, created_date: string) =>
  ({ id, sort_order, created_date }) as Submission;

describe("shared document ordering", () => {
  it.each(["asc", "desc"] as const)(
    "keeps priorities first for %s dates without mutating input",
    (direction) => {
      const input = [
        doc(1, 2, "2026-03-01"),
        doc(2, 0, "2026-02-01"),
        doc(3, 0, "2026-01-01"),
      ];
      const original = [...input];
      const sorted = orderDocumentsBySortOrder(input, direction);
      expect(sorted.map(({ id }) => id)).toEqual(
        direction === "asc" ? [3, 2, 1] : [2, 3, 1],
      );
      expect(input).toEqual(original);
      expect(sorted).not.toBe(input);
    },
  );

  it("retains input order for equal priority and timestamp", () => {
    const input = [doc(2, 1, "invalid"), doc(1, 1, "invalid")];
    expect(orderDocumentsBySortOrder(input)).toEqual(input);
  });
});
