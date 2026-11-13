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

  it("returns the proponent card statuses derived from the newest main document", () => {
    // The Regulated Party card receives a single derived status from the API.
    expect(getReportStatus(["SUBMITTED"])).toBe("SUBMITTED");
    expect(getReportStatus(["UPLOADED_BY_EAO"])).toBe("UPLOADED_BY_EAO");
  });

  it("prefers Uploaded by EAO over every other status", () => {
    expect(
      getReportStatus(["ACKNOWLEDGED", "VERIFIED", "UPLOADED_BY_EAO"]),
    ).toBe("UPLOADED_BY_EAO");
  });

  it("returns null for statuses that are not part of the report status set", () => {
    expect(getReportStatus(["IN_PROGRESS"])).toBeNull();
    // Ready for Acknowledgement is not a report card status.
    expect(getReportStatus(["READY_FOR_ACKNOWLEDGEMENT"])).toBeNull();
  });
});
