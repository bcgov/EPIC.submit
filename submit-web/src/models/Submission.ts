// NonCanonicalSubmissionStatus are just for display purpose, they are not canonical business statuses
export type NonCanonicalSubmissionStatus =
  | "PENDING_MANAGER_REVIEW"
  | "REVISION_REQUIRED"
  | "REVISION_REQUESTED"
  | "UPDATED"
  | "UPDATE_REQUESTED"
  | "NO_REVISION_REQUIRED"
  | "PREVIOUSLY_FAILED"
  | "NEW_VERSION"
  | "FAILED"
  | "FLAGGED_FOR_UPDATE";

export const NON_CANONICAL_SUBMISSION_STATUS = Object.freeze<
  Record<NonCanonicalSubmissionStatus, NonCanonicalSubmissionStatus>
>({
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  NEW_VERSION: "NEW_VERSION",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  UPDATED: "UPDATED",
  FAILED: "FAILED",
  NO_REVISION_REQUIRED: "NO_REVISION_REQUIRED",
  PREVIOUSLY_FAILED: "PREVIOUSLY_FAILED",
  FLAGGED_FOR_UPDATE: "FLAGGED_FOR_UPDATE",
});

export type SubmissionItemStatus =
  | "NEW_SUBMISSION"
  | "NEW"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "SUBMITTED"
  | "REVIEW_REJECTED"
  | "REVIEW_NOT_COMPLETED"
  | "FAILED_CONSULTATION_CHECK"
  | "PASSED_CONSULTATION_CHECK"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "REVIEWED"
  | "ACCEPTED"
  | "SATISFIED"
  | "UPDATE_REQUESTED"
  | "UPDATED"
  | "AWAITING_MANAGER_APPROVAL"
  | "REVISION_REQUESTED"
  | "NO_REVISION_REQUIRED"
  | "UNDER_REVIEW"
  | "NOT_APPLICABLE"
  | "UNDER_CONSULTATION_CHECK"
  | "ACKNOWLEDGED"
  | "NOT_APPROVED"
  | "WITHDRAWN";

export type SubmissionFilterRole = "eao" | "proponent";

export type SubmissionItemStatusEntry = {
  value: SubmissionItemStatus;
  label: string;
  // Which filter UIs this status appears in
  filter?: SubmissionFilterRole[];
  // Groups multiple statuses under a single display option, e.g. "Completed").
  // filterGroup?: string;
  sortOrder?: number;
  isGroup?: boolean;
};

export const SUBMISSION_ITEM_STATUS: Record<
  SubmissionItemStatus,
  SubmissionItemStatusEntry
> = {
  NOT_APPLICABLE: {
    value: "NOT_APPLICABLE",
    label: "Not Applicable",
  },
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
    filter: ["eao"],
    sortOrder: 1,
  },
  NEW: {
    value: "NEW",
    label: "New",
    filter: ["proponent"],
    sortOrder: 1,
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completed",
    // filter: ["proponent"],
    sortOrder: 7,
  },
  PARTIALLY_COMPLETED: {
    value: "PARTIALLY_COMPLETED",
    label: "Partially Completed",
    filter: ["proponent"],
    sortOrder: 5,
  },
  SUBMITTED: {
    value: "SUBMITTED",
    label: "Submitted",
    filter: ["proponent"],
    sortOrder: 6,
  },
  PASSED_CONSULTATION_CHECK: {
    value: "PASSED_CONSULTATION_CHECK",
    label: "Passed Consultation Check",
    filter: ["eao", "proponent"],
    sortOrder: 9,
  },
  REVIEW_REJECTED: {
    value: "REVIEW_REJECTED",
    label: "Review Rejected",
    filter: ["proponent"],
  },
  REVIEW_NOT_COMPLETED: {
    value: "REVIEW_NOT_COMPLETED",
    label: "Review Not Completed",
  },
  FAILED_CONSULTATION_CHECK: {
    value: "FAILED_CONSULTATION_CHECK",
    label: "Failed Consultation Check",
    filter: ["eao"],
    sortOrder: 8,
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
    filter: ["eao", "proponent"],
    sortOrder: 13,
  },
  REVISION_REQUIRED: {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
    filter: ["proponent"],
    sortOrder: 4,
  },
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
    filter: ["eao", "proponent"],
    sortOrder: 10,
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
    filter: ["eao", "proponent"],
    sortOrder: 11,
  },
  SATISFIED: {
    value: "SATISFIED",
    label: "Satisfied",
    filter: ["eao", "proponent"],
    sortOrder: 12,
  },
  UPDATE_REQUESTED: {
    value: "UPDATE_REQUESTED",
    label: "Update Requested",
    filter: ["eao", "proponent"],
    sortOrder: 3,
  },
  UPDATED: {
    value: "UPDATED",
    label: "Updated",
    filter: ["eao", "proponent"],
    sortOrder: 2,
  },
  AWAITING_MANAGER_APPROVAL: {
    value: "AWAITING_MANAGER_APPROVAL",
    label: "Awaiting Manager Approval",
    filter: ["eao"],
    sortOrder: 7,
  },
  REVISION_REQUESTED: {
    value: "REVISION_REQUESTED",
    label: "Revision Requested",
    filter: ["eao"],
    sortOrder: 6,
  },
  NO_REVISION_REQUIRED: {
    value: "NO_REVISION_REQUIRED",
    label: "No Revision Required",
  },
  UNDER_REVIEW: {
    value: "UNDER_REVIEW",
    label: "Under Review",
    filter: ["eao"],
    sortOrder: 4,
  },
  UNDER_CONSULTATION_CHECK: {
    value: "UNDER_CONSULTATION_CHECK",
    label: "Under Consultation Check",
    filter: ["eao"],
    sortOrder: 5,
  },
  ACKNOWLEDGED: {
    value: "ACKNOWLEDGED",
    label: "Acknowledged",
    filter: ["eao"],
  },
  NOT_APPROVED: {
    value: "NOT_APPROVED",
    label: "Not Approved",
    filter: ["eao", "proponent"],
  },
  WITHDRAWN: {
    value: "WITHDRAWN",
    label: "Withdrawn",
  },
};

export const EAO_SUBMISSION_ITEM_FILTERS = Object.fromEntries(
  Object.entries(SUBMISSION_ITEM_STATUS).filter(([, s]) =>
    s.filter?.includes("eao"),
  ),
) as Partial<Record<SubmissionItemStatus, SubmissionItemStatusEntry>>;

export const PROPONENT_SUBMISSION_ITEM_FILTERS = Object.fromEntries(
  Object.entries(SUBMISSION_ITEM_STATUS).filter(([, s]) =>
    s.filter?.includes("proponent"),
  ),
) as Partial<Record<SubmissionItemStatus, SubmissionItemStatusEntry>>;

export const FILTER_GROUPS: Partial<
  Record<SubmissionItemStatus, { label: string }>
> = {
  REVIEWED: { label: "Completed" },
  ACCEPTED: { label: "Completed" },
  SATISFIED: { label: "Completed" },
  APPROVED: { label: "Completed" },
  COMPLETED: { label: "Completed" },
};

export const expandStatusFilters = (statuses: string[]): string[] => {
  return statuses.flatMap((s) => {
    const groupLabel = FILTER_GROUPS[s as SubmissionItemStatus]?.label;
    if (!groupLabel) return [s];
    return Object.values(SUBMISSION_ITEM_STATUS)
      .filter((entry) => FILTER_GROUPS[entry.value]?.label === groupLabel)
      .map((entry) => entry.value);
  });
};

export type SubmittedForm = {
  id: number;
  submission_json: {
    [x: string]: unknown;
  };
};

export type SubmissionType = "FORM" | "DOCUMENT" | "BUSINESS_DATA";

export const SUBMISSION_TYPE: Record<SubmissionType, SubmissionType> = {
  FORM: "FORM",
  DOCUMENT: "DOCUMENT",
  BUSINESS_DATA: "BUSINESS_DATA",
};

export type DocumentSubmission = {
  id: number;
  name: string;
  url: string;
  folder: string;
};

export type SubmissionStatus =
  | "SUBMITTED"
  | "REJECTED"
  | "APPROVED"
  | "PENDING"
  | "VERIFIED"
  | "ACKNOWLEDGED";

export const SUBMISSION_STATUS = Object.freeze<
  Record<SubmissionStatus, SubmissionStatus>
>({
  SUBMITTED: "SUBMITTED",
  REJECTED: "REJECTED",
  APPROVED: "APPROVED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
});

export type Submission = {
  id: number;
  item_id: number;
  version: string;
  minor_version: number;
  major_version: number;
  type: SubmissionType;
  submitted_document?: DocumentSubmission;
  submitted_document_id?: number;
  submitted_form?: SubmittedForm;
  created_date: string;
  submitted_by: string;
  status: SubmissionStatus;
  is_updated: boolean;
};

export type SubmittedDocument = {
  id: number;
  name: string;
  url: string;
  project_name: string;
  status: string;
  submitted_on: string;
  version: string;
};

export type PaginatedSubmittedDocument = {
  id: number;
  name: string;
  url: string;
  work: string;
  phase: string;
  version: string;
  submitted_on: string;
  status: string;
  root_submission_id: number;
};

export type PaginatedDocumentsResponse = {
  items: PaginatedSubmittedDocument[];
  total: number;
  page: number;
  size: number;
};
