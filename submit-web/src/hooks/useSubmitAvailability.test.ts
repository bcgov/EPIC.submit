import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSubmitAvailability } from "./useSubmitAvailability";
import { SubmissionPackage } from "@/models/Package";

const baseWorkPackage: SubmissionPackage = {
  id: 1,
  name: "Work Package",
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
  account_project_work: { id: 1, work_id: 10, work: { id: 10 } } as any,
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

const baseMPPackage: SubmissionPackage = {
  ...baseWorkPackage,
  name: "MP Package",
  type: {
    id: 2,
    name: "Management Plan" as any,
    versioning_enabled: true,
    mandatory: false,
  },
  account_project_work: undefined,
};

describe("useSubmitAvailability", () => {
  describe("Work package pre-acknowledgement (Rule 1)", () => {
    it("returns isSubmitDisabled=false for submitted work package without update requests", () => {
      const { result } = renderHook(() =>
        useSubmitAvailability(baseWorkPackage),
      );
      expect(result.current.isSubmitDisabled).toBe(false);
    });

    it("returns isSubmitDisabled=false for work package with no updated items and no requests", () => {
      const pkg: SubmissionPackage = {
        ...baseWorkPackage,
        update_requests: [],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(false);
    });
  });

  describe("Work package post-acknowledgement (Rule 2)", () => {
    it("returns isSubmitDisabled=true when acknowledged with no open requests", () => {
      const pkg: SubmissionPackage = {
        ...baseWorkPackage,
        status: ["ACKNOWLEDGED"],
        update_requests: [],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(true);
    });

    it("returns isSubmitDisabled=false when acknowledged with open requests", () => {
      const pkg: SubmissionPackage = {
        ...baseWorkPackage,
        status: ["ACKNOWLEDGED"],
        update_requests: [
          {
            id: 1,
            submission_item_types: [1],
            reason: "Need update",
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
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(false);
    });
  });

  describe("MP/IEM package (Rule 3)", () => {
    it("returns isSubmitDisabled=true for submitted MP with no update requests", () => {
      const { result } = renderHook(() => useSubmitAvailability(baseMPPackage));
      expect(result.current.isSubmitDisabled).toBe(true);
    });

    it("returns isSubmitDisabled=false for MP with open update request", () => {
      const pkg: SubmissionPackage = {
        ...baseMPPackage,
        update_requests: [
          {
            id: 1,
            submission_item_types: [1],
            reason: "Need update",
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
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(false);
    });

    it("returns isSubmitDisabled=false for MP with pending review request", () => {
      const pkg: SubmissionPackage = {
        ...baseMPPackage,
        update_requests: [
          {
            id: 1,
            submission_item_types: [1],
            reason: "Revision",
            created_date: "2026-01-01",
            created_by: "staff",
            submission_package_id: 1,
            active: true,
            type: "REVIEW",
            note: "",
            status: "PENDING_REVIEW",
          },
        ],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(false);
    });
  });

  describe("Updated items override", () => {
    it("returns isSubmitDisabled=false when package has updated items regardless of status", () => {
      const pkg: SubmissionPackage = {
        ...baseMPPackage,
        items: [
          {
            id: 1,
            type_id: 1,
            type: { id: 1, name: "Section", submission_method: "upload" },
            status: "SUBMITTED",
            submissions: [
              {
                id: 1,
                type: "DOCUMENT",
                is_updated: true,
                status: "PENDING",
              } as any,
            ],
          } as any,
        ],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isSubmitDisabled).toBe(false);
    });
  });

  describe("Package state flags", () => {
    it("correctly identifies withdrawn package", () => {
      const pkg: SubmissionPackage = {
        ...baseWorkPackage,
        status: ["WITHDRAWN"],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isPackageWithdrawn).toBe(true);
    });

    it("correctly identifies acknowledged package", () => {
      const pkg: SubmissionPackage = {
        ...baseWorkPackage,
        status: ["ACKNOWLEDGED"],
      };
      const { result } = renderHook(() => useSubmitAvailability(pkg));
      expect(result.current.isPackageAcknowledged).toBe(true);
    });
  });
});
