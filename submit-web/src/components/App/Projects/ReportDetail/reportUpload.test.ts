import { describe, it, expect } from "vitest";
import {
  ADD_SUCCESS_MESSAGE,
  DATE_RECEIVED_FUTURE_ERROR,
  DATE_RECEIVED_HELP_TEXT,
  DATE_RECEIVED_REQUIRED_ERROR,
  getPrimaryUploadLabel,
} from "./reportUpload";

describe("EAO add-document copy", () => {
  it("uses the wording from the story", () => {
    expect(ADD_SUCCESS_MESSAGE).toBe("Documents added successfully");
    expect(DATE_RECEIVED_HELP_TEXT).toBe(
      "The date the EAO received the document. It shows as Date Submitted.",
    );
    expect(DATE_RECEIVED_REQUIRED_ERROR).toBe(
      "Please enter the date the EAO received the document.",
    );
    expect(DATE_RECEIVED_FUTURE_ERROR).toBe(
      "The date received cannot be in the future.",
    );
  });
});

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
