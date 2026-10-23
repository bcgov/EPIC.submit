import { describe, it, expect } from "vitest";
import { getPrimaryUploadLabel } from "./reportUpload";

describe("getPrimaryUploadLabel", () => {
  it("returns 'Upload Notification' for Compliance Notification", () => {
    expect(getPrimaryUploadLabel("Compliance Notification")).toBe(
      "Upload Notification",
    );
  });

  it("returns 'Upload Notification' for Project Status Notification", () => {
    expect(getPrimaryUploadLabel("Project Status Notification")).toBe(
      "Upload Notification",
    );
  });

  it("returns 'Upload Report' for other report types", () => {
    expect(getPrimaryUploadLabel("Compliance Self-Report")).toBe(
      "Upload Report",
    );
    expect(getPrimaryUploadLabel("Annual Report")).toBe("Upload Report");
  });

  it("returns 'Upload Report' when the type is missing", () => {
    expect(getPrimaryUploadLabel(null)).toBe("Upload Report");
    expect(getPrimaryUploadLabel(undefined)).toBe("Upload Report");
  });
});
