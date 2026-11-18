import { describe, expect, it } from "vitest";
import { getSubmissionPhaseStatus } from "./constants";

describe("getSubmissionPhaseStatus", () => {
  it("formats the label as Submitting documents text", () => {
    expect(
      getSubmissionPhaseStatus("Pre-EA/Early Engagement", "Early Engagement"),
    ).toBe("Submitting documents for Pre-EA/Early Engagement");
  });

  it("trims whitespace around the label", () => {
    expect(getSubmissionPhaseStatus("  Pre-EA  ", "Fallback")).toBe(
      "Submitting documents for Pre-EA",
    );
  });

  it.each([null, undefined, "", "   "])(
    "falls back to the phase name for label %j",
    (label) => {
      expect(getSubmissionPhaseStatus(label, "Early Engagement")).toBe(
        "Early Engagement",
      );
    },
  );
});
