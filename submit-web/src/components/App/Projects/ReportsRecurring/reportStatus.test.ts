import { describe, it, expect } from "vitest";
import { getReportStatus } from "./reportStatus";

describe("getReportStatus", () => {
  it("returns null when nothing has been submitted", () => {
    expect(getReportStatus([])).toBeNull();
    expect(getReportStatus(undefined)).toBeNull();
  });

  it("returns New Submission when a document is awaiting verification", () => {
    expect(getReportStatus(["NEW_SUBMISSION"])).toBe("NEW_SUBMISSION");
  });

  it("prefers New Submission over later terminal statuses", () => {
    expect(getReportStatus(["VERIFIED", "NEW_SUBMISSION"])).toBe(
      "NEW_SUBMISSION",
    );
  });

  it("falls back to a terminal status when there is no new submission", () => {
    expect(getReportStatus(["VERIFIED"])).toBe("VERIFIED");
    expect(getReportStatus(["ACKNOWLEDGED"])).toBe("ACKNOWLEDGED");
  });

  it("prefers Pending Acknowledgement over Verified for a verified Compliance Self-Report", () => {
    // A verified Report_TypeB package carries both VERIFIED and
    // PENDING_ACKNOWLEDGEMENT; the card shows Pending Acknowledgement alone.
    expect(getReportStatus(["VERIFIED", "PENDING_ACKNOWLEDGEMENT"])).toBe(
      "PENDING_ACKNOWLEDGEMENT",
    );
  });

  it("returns null for statuses that are not part of the report status set", () => {
    expect(getReportStatus(["IN_PROGRESS"])).toBeNull();
  });
});
