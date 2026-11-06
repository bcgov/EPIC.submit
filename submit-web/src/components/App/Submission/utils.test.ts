import { describe, it, expect } from "vitest";
import {
  getMissingMainDocumentMessage,
  isSubmissionItemReadyToSubmit,
  orderDocumentsBySortOrder,
} from "./utils";
import {
  SUBMISSION_SORT_ORDER,
  SUBMISSION_TYPE,
  type Submission,
  type SubmissionItemStatus,
} from "@/models/Submission";
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
    is_latest: true, is_enforceable: false,
  },
};

const makeItem = (overrides: Partial<{ status: SubmissionItemStatus; is_required: boolean }> = {}) => ({
  id: 1,
  status: overrides.status ?? ("COMPLETED" as const),
  type: { id: 1, name: "Section A", submission_method: "upload" },
  is_required: overrides.is_required ?? true,
});

const makeDocumentSubmission = (
  sort_order: number,
  created_date: string,
): Submission => ({
  id: 1,
  item_id: 1,
  version: "1.1",
  minor_version: 1,
  major_version: 1,
  type: SUBMISSION_TYPE.DOCUMENT,
  created_date,
  submitted_by: "user",
  status: "PENDING",
  is_updated: false,
  sort_order,
});

describe("isSubmissionItemReadyToSubmit", () => {
  it("requires an explicitly prioritized main document for document sections", () => {
    const item = {
      ...makeItem(),
      type: {
        id: 1,
        name: "Initial Project Description",
        submission_method: "DOCUMENT_UPLOAD",
      },
      submissions: [
        makeDocumentSubmission(
          SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
          "2026-01-01T00:00:00Z",
        ),
      ],
    };

    expect(
      isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: item,
      }),
    ).toBe(false);
    expect(getMissingMainDocumentMessage(item)).toContain(
      "section/document name:  IPD",
    );
  });

  it("accepts a required document section with a main document", () => {
    const item = {
      ...makeItem(),
      type: {
        id: 1,
        name: "Engagement Plan",
        submission_method: "DOCUMENT_UPLOAD",
      },
      submissions: [
        makeDocumentSubmission(
          SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
          "2026-01-01T00:00:00Z",
        ),
      ],
    };

    expect(getMissingMainDocumentMessage(item)).toBeUndefined();
    expect(
      isSubmissionItemReadyToSubmit({
        submissionPackage: basePackage,
        submissionItem: item,
      }),
    ).toBe(true);
  });

  it("keeps the existing form-submission completion path", () => {
    const item = {
      ...makeItem(),
      type: { id: 1, name: "Form Section", submission_method: "FORM_SUBMISSION" },
    };
    expect(getMissingMainDocumentMessage(item)).toBeUndefined();
  });

  it("uses the requested section label when the main file is missing", () => {
    const item = {
      ...makeItem(),
      type: {
        id: 1,
        name: "Geospatial Information",
        submission_method: "DOCUMENT_UPLOAD",
      },
      submissions: [],
    };

    expect(getMissingMainDocumentMessage(item)).toBe(
      "You must have at least one file uploaded in this section " +
        "(section/document name:  GIS) to be able to submit your package",
    );
  });

  it("does not require a main document for an optional document section", () => {
    const item = {
      ...makeItem({ is_required: false }),
      type: {
        id: 1,
        name: "Optional Documents",
        submission_method: "DOCUMENT_UPLOAD",
      },
      submissions: [],
    };

    expect(getMissingMainDocumentMessage(item)).toBeUndefined();
  });

  it("orders document groups by priority and then upload time", () => {
    const ordered = orderDocumentsBySortOrder([
      makeDocumentSubmission(1, "2026-01-01T00:00:00Z"),
      makeDocumentSubmission(0, "2026-01-02T00:00:00Z"),
      makeDocumentSubmission(0, "2026-01-01T00:00:00Z"),
    ]);

    expect(
      ordered.map(({ sort_order, created_date }) => [sort_order, created_date]),
    ).toEqual([
      [0, "2026-01-01T00:00:00Z"],
      [0, "2026-01-02T00:00:00Z"],
      [1, "2026-01-01T00:00:00Z"],
    ]);
  });

  it("treats a missing priority as supporting and handles invalid dates stably", () => {
    const missingPriority = {
      ...makeDocumentSubmission(0, "not-a-date"),
      sort_order: undefined,
    } as unknown as Submission;
    const laterSupporting = makeDocumentSubmission(1, "also-not-a-date");
    const ordered = orderDocumentsBySortOrder([
      laterSupporting,
      missingPriority,
    ]);

    expect(ordered).toEqual([laterSupporting, missingPriority]);
  });

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
