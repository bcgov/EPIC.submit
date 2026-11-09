import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentChangeTracking } from "./useDocumentChangeTracking";
import { SubmissionPackage } from "@/models/Package";

interface TestSubmission {
  status: string;
  created_date?: string;
  submitted_document?: { id: number };
}

const buildPackage = (
  submitted_on: string | undefined,
  items: { type_id: number; submissions?: TestSubmission[] }[],
) => ({ submitted_on, items }) as unknown as SubmissionPackage;

describe("useDocumentChangeTracking", () => {
  it("returns an empty object when the package is undefined", () => {
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: undefined }),
    );
    expect(result.current).toEqual({});
  });

  it("returns an empty object when disabled", () => {
    const pkg = buildPackage("2026-01-01T00:00:00Z", [{ type_id: 1 }]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg, enabled: false }),
    );
    expect(result.current).toEqual({});
  });

  it("marks items without submissions as having no new documents", () => {
    const pkg = buildPackage("2026-01-01T00:00:00Z", [{ type_id: 1 }]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1]).toEqual({
      hasNewDocuments: false,
      newDocumentIds: [],
      lastModified: null,
    });
  });

  it("flags documents created after the last submission date", () => {
    const pkg = buildPackage("2026-01-01T00:00:00Z", [
      {
        type_id: 1,
        submissions: [
          {
            status: "SUBMITTED",
            created_date: "2026-02-01T00:00:00Z",
            submitted_document: { id: 10 },
          },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1].hasNewDocuments).toBe(true);
    expect(result.current[1].newDocumentIds).toEqual([10]);
  });

  it("does not flag older submitted documents", () => {
    const pkg = buildPackage("2026-03-01T00:00:00Z", [
      {
        type_id: 1,
        submissions: [
          {
            status: "SUBMITTED",
            created_date: "2026-02-01T00:00:00Z",
            submitted_document: { id: 10 },
          },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1].hasNewDocuments).toBe(false);
    expect(result.current[1].newDocumentIds).toEqual([]);
  });

  it("flags older documents that are still pending", () => {
    const pkg = buildPackage("2026-03-01T00:00:00Z", [
      {
        type_id: 1,
        submissions: [
          {
            status: "PENDING",
            created_date: "2026-02-01T00:00:00Z",
            submitted_document: { id: 11 },
          },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1].newDocumentIds).toEqual([11]);
  });

  it("treats every dated document as new when the package was never submitted", () => {
    const pkg = buildPackage(undefined, [
      {
        type_id: 2,
        submissions: [
          {
            status: "SUBMITTED",
            created_date: "2026-02-01T00:00:00Z",
            submitted_document: { id: 12 },
          },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[2].newDocumentIds).toEqual([12]);
  });

  it("tracks the latest created date as lastModified", () => {
    const pkg = buildPackage("2026-01-01T00:00:00Z", [
      {
        type_id: 1,
        submissions: [
          {
            status: "SUBMITTED",
            created_date: "2026-02-01T00:00:00Z",
            submitted_document: { id: 1 },
          },
          {
            status: "SUBMITTED",
            created_date: "2026-04-01T00:00:00Z",
            submitted_document: { id: 2 },
          },
          {
            status: "SUBMITTED",
            created_date: "2026-03-01T00:00:00Z",
            submitted_document: { id: 3 },
          },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1].lastModified).toBe("2026-04-01T00:00:00Z");
    expect(result.current[1].newDocumentIds).toEqual([1, 2, 3]);
  });

  it("ignores submissions without a document or created date", () => {
    const pkg = buildPackage("2026-01-01T00:00:00Z", [
      {
        type_id: 1,
        submissions: [
          { status: "SUBMITTED", created_date: "2026-02-01T00:00:00Z" },
          { status: "SUBMITTED", submitted_document: { id: 5 } },
        ],
      },
    ]);
    const { result } = renderHook(() =>
      useDocumentChangeTracking({ submissionPackage: pkg }),
    );
    expect(result.current[1]).toEqual({
      hasNewDocuments: false,
      newDocumentIds: [],
      lastModified: null,
    });
  });
});
