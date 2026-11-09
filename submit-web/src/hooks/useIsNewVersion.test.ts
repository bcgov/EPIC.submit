import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsNewVersion } from "./useIsNewVersion";
import { Submission } from "@/models/Submission";

const build = (overrides: Partial<Submission>) =>
  ({
    status: "SUBMITTED",
    minor_version: 2,
    is_updated: true,
    ...overrides,
  }) as unknown as Submission;

const run = (submission: Submission) =>
  renderHook(() => useIsNewVersion({ submission })).result.current;

describe("useIsNewVersion", () => {
  it.each(["SUBMITTED", "PENDING", "VERIFIED", "ACKNOWLEDGED"])(
    "returns true for %s status with minor_version > 1 and is_updated",
    (status) => {
      expect(run(build({ status } as Partial<Submission>))).toBe(true);
    },
  );

  it("returns false for a status that is not allowed", () => {
    expect(run(build({ status: "REJECTED" } as Partial<Submission>))).toBe(
      false,
    );
  });

  it("returns false when minor_version is 1", () => {
    expect(run(build({ minor_version: 1 }))).toBe(false);
  });

  it("returns false when is_updated is false", () => {
    expect(run(build({ is_updated: false }))).toBe(false);
  });

  it("recomputes when the submission changes", () => {
    const { result, rerender } = renderHook(
      ({ submission }) => useIsNewVersion({ submission }),
      { initialProps: { submission: build({}) } },
    );
    expect(result.current).toBe(true);
    rerender({ submission: build({ is_updated: false }) });
    expect(result.current).toBe(false);
  });
});
