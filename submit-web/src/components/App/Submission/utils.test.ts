import { describe, it, expect } from "vitest";
import { isSubmissionItemReadyToSubmit } from "./utils";
import { SubmissionPackage } from "@/models/Package";

const basePackage: SubmissionPackage = {
  id: 1,
  name: "Test Package",
  status: ["SUBMITTED"],
  submitted_on: "2026-01-01T00:00:00Z",
  type_id: 1,
  type: {
    id: 1,
    name: "Additional Information" as any,
    versioning_enabled: true,
    mandatory: false,
  },
  items: [],
  account_project_id: 1,
  update_requests: [],
  all_update_requests: [],
  version: {
    id: 1,
    package_id: 1,
    version: 1,
    original_package_id: 1,
    is_approved: false,
    is_latest: true,
  },
};

const makeItem = (overrides: Partial<{ status: string; is_required: boolean }> = {}) => ({
  id: 1,
  status: overrides.status ?? "COMPLETED",
  type: { id: 1, name: "Section A", submission_method: "upload" },
  is_required: overrides.is_required ?? true,
});

describe("isSubmissionItemReadyToSubmit", () => {
  describe("Work package resubmit without update requests (pre-ack)", () => {
    it("returns false for required item that is not completed", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: makeItem({ status: "NEW", is_required: true }),
      });
      expect(result).toBe(false);
    });

    it("returns true for required item with COMPLETED status", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: makeItem({ status: "COMPLETED", is_required: true }),
      });
      expect(result).toBe(true);
    });

    it("returns true for required item with SUBMITTED status", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: makeItem({ status: "SUBMITTED", is_required: true }),
      });
      expect(result).toBe(true);
    });

    it("returns true for optional item regardless of status", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: makeItem({ status: "NEW", is_required: false }),
      });
      expect(result).toBe(true);
    });
  });

  describe("Package with update requests (update-request-gated resubmit)", () => {
    const pkgWithRequests: SubmissionPackage = {
      ...basePackage,
      update_requests: [
        {
          id: 1,
          submission_item_types: [1],
          reason: "Need docs",
          created_date: "2026-01-01",
          created_by: "staff",
          submission_package_id: 1,
          active: true,
          type: "UPDATE",
          note: "",
          status: "OPEN",
        },
      ],
    };

    it("returns true for all items when package has update requests", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: pkgWithRequests,
        submissionItem: makeItem({ status: "NEW", is_required: true }),
      });
      expect(result).toBe(true);
    });

    it("returns true for incomplete required item with update requests", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: pkgWithRequests,
        submissionItem: makeItem({
          status: "PARTIALLY_COMPLETED",
          is_required: true,
        }),
      });
      expect(result).toBe(true);
    });
  });

  describe("First submission (not yet submitted)", () => {
    const unsubmittedPackage: SubmissionPackage = {
      ...basePackage,
      submitted_on: undefined as any,
    };

    it("returns false for required item that is not completed", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: unsubmittedPackage,
        submissionItem: makeItem({ status: "NEW", is_required: true }),
      });
      expect(result).toBe(false);
    });

    it("returns true for required item with COMPLETED status", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: unsubmittedPackage,
        submissionItem: makeItem({ status: "COMPLETED", is_required: true }),
      });
      expect(result).toBe(true);
    });

    it("returns true for optional item on first submission", () => {
      const result = isSubmissionItemReadyToSubmit({
        submissionPackage: unsubmittedPackage,
        submissionItem: makeItem({ status: "NEW", is_required: false }),
      });
      expect(result).toBe(true);
    });
  });
});
