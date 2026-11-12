import { describe, expect, it } from "vitest";
import { Submission } from "@/models/Submission";
import {
  getSubmissionDate,
  orderDocumentsBySortOrder,
} from "./submissionDocuments";

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

describe("date received ordering", () => {
  const received = (
    id: number,
    sort_order: number,
    created_date: string,
    received_date: string,
  ) =>
    ({
      id,
      sort_order,
      created_date,
      received_date,
      is_eao_uploaded: true,
    }) as Submission;

  it("sorts a document received earlier below newer ones in the same priority", () => {
    const input = [
      received(1, 0, "2026-11-05T10:00:00", "2026-01-05"),
      doc(2, 0, "2026-09-30T12:00:00"),
      doc(3, 0, "2026-03-25T12:00:00"),
    ];
    expect(
      orderDocumentsBySortOrder(input, "desc").map(({ id }) => id),
    ).toEqual([2, 3, 1]);
  });

  it("places a document received most recently first even if uploaded earlier", () => {
    const input = [
      doc(1, 0, "2026-09-30T12:00:00"),
      received(2, 0, "2026-09-01T10:00:00", "2026-10-09"),
    ];
    expect(
      orderDocumentsBySortOrder(input, "desc").map(({ id }) => id),
    ).toEqual([2, 1]);
  });

  it("keeps main documents above supporting documents whatever the dates", () => {
    const input = [
      received(1, 1, "2026-11-05T10:00:00", "2026-10-09"),
      received(2, 0, "2026-11-05T10:00:00", "2025-01-01"),
    ];
    expect(
      orderDocumentsBySortOrder(input, "desc").map(({ id }) => id),
    ).toEqual([2, 1]);
  });
});

describe("getSubmissionDate", () => {
  it("returns the received date untouched", () => {
    const submission = {
      created_date: "2026-11-05T01:00:00",
      received_date: "2026-10-09",
    } as Submission;
    expect(getSubmissionDate(submission)).toBe("2026-10-09");
  });

  it("falls back to the formatted upload date", () => {
    const submission = {
      created_date: "2026-09-30T12:00:00",
      received_date: null,
    } as Submission;
    expect(getSubmissionDate(submission)).toBe("2026-09-30");
  });

  it("returns an empty string for an unusable date", () => {
    expect(getSubmissionDate({ created_date: "invalid" } as Submission)).toBe(
      "",
    );
  });
});
