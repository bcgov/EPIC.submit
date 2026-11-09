import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsNewDocument } from "./useIsNewDocument";
import { SUBMISSION_STATUS, Submission } from "@/models/Submission";

const makeSubmission = (overrides: Partial<Submission> = {}): Submission => ({
  id: 1,
  item_id: 10,
  version: "1.1",
  minor_version: 1,
  major_version: 1,
  type: "DOCUMENT",
  created_date: "2024-01-01T00:00:00Z",
  submitted_by: "user-1",
  status: SUBMISSION_STATUS.SUBMITTED,
  is_updated: true,
  ...overrides,
});

describe("useIsNewDocument", () => {
  it("returns true for a newly added document (minor_version 1, is_updated, SUBMITTED)", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({ submission: makeSubmission() }),
    );
    expect(result.current).toBe(true);
  });

  it("returns false for a replaced document (minor_version > 1)", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({ submission: makeSubmission({ minor_version: 2 }) }),
    );
    expect(result.current).toBe(false);
  });

  it("returns false when is_updated is false (badge cleared)", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({ submission: makeSubmission({ is_updated: false }) }),
    );
    expect(result.current).toBe(false);
  });

  it("returns false when status is outside the allowed set", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({
        submission: makeSubmission({ status: SUBMISSION_STATUS.REJECTED }),
      }),
    );
    expect(result.current).toBe(false);
  });

  it("returns true while status is PENDING", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({
        submission: makeSubmission({ status: SUBMISSION_STATUS.PENDING }),
      }),
    );
    expect(result.current).toBe(true);
  });

  it("returns true while status is VERIFIED (mirrors New Version clearing behavior)", () => {
    const { result } = renderHook(() =>
      useIsNewDocument({
        submission: makeSubmission({ status: SUBMISSION_STATUS.VERIFIED }),
      }),
    );
    expect(result.current).toBe(true);
  });
});
