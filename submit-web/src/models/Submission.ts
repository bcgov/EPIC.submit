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

export const SUBMISSION_ITEM_STATUS: Record<
  SubmissionItemStatus,
  { value: SubmissionItemStatus; label: string }
> = {
  NOT_APPLICABLE: {
    value: "NOT_APPLICABLE",
    label: "Not Applicable",
  },
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
  },
  NEW: {
    value: "NEW",
    label: "New",
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completed",
  },
  PARTIALLY_COMPLETED: {
    value: "PARTIALLY_COMPLETED",
    label: "Partially Completed",
  },
  SUBMITTED: {
    value: "SUBMITTED",
    label: "Submitted",
  },
  PASSED_CONSULTATION_CHECK: {
    value: "PASSED_CONSULTATION_CHECK",
    label: "Passed Consultation Check",
  },
  REVIEW_REJECTED: {
    value: "REVIEW_REJECTED",
    label: "Review Rejected",
  },
  REVIEW_NOT_COMPLETED: {
    value: "REVIEW_REJECTED",
    label: "Review Rejected",
  },
  FAILED_CONSULTATION_CHECK: {
    value: "FAILED_CONSULTATION_CHECK",
    label: "Review Not Completed",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  REVISION_REQUIRED: {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
  },
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
  },
  SATISFIED: {
    value: "SATISFIED",
    label: "Satisfied",
  },
  UPDATE_REQUESTED: {
    value: "UPDATE_REQUESTED",
    label: "Update Requested",
  },
  UPDATED: {
    value: "UPDATED",
    label: "Updated",
  },
  AWAITING_MANAGER_APPROVAL: {
    value: "AWAITING_MANAGER_APPROVAL",
    label: "Awaiting Manager Approval",
  },
  REVISION_REQUESTED: {
    value: "REVISION_REQUESTED",
    label: "Revision Requested",
  },
  NO_REVISION_REQUIRED: {
    value: "NO_REVISION_REQUIRED",
    label: "No Revision Required",
  },
  UNDER_REVIEW: {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  UNDER_CONSULTATION_CHECK: {
    value: "UNDER_CONSULTATION_CHECK",
    label: "Under Consultation Check",
  },
  ACKNOWLEDGED: {
    value: "ACKNOWLEDGED",
    label: "Acknowledged",
  },
  NOT_APPROVED: {
    value: "NOT_APPROVED",
    label: "Not Approved",
  },
  WITHDRAWN: {
    value: "WITHDRAWN",
    label: "Withdrawn",
  },
};

export const EAO_SUBMISSION_ITEM_FILTERS: Partial<
  Record<SubmissionItemStatus, { value: SubmissionItemStatus; label: string }>
> = {
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
  },
  UPDATED: {
    value: "UPDATED",
    label: "Updated",
  },
  UPDATE_REQUESTED: {
    value: "UPDATE_REQUESTED",
    label: "Update Requested",
  },
  UNDER_REVIEW: {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  UNDER_CONSULTATION_CHECK: {
    value: "UNDER_CONSULTATION_CHECK",
    label: "Under Consultation Check",
  },
  REVISION_REQUESTED: {
    value: "REVISION_REQUESTED",
    label: "Revision Requested",
  },
  AWAITING_MANAGER_APPROVAL: {
    value: "AWAITING_MANAGER_APPROVAL",
    label: "Awaiting Manager Approval",
  },
  FAILED_CONSULTATION_CHECK: {
    value: "FAILED_CONSULTATION_CHECK",
    label: "Failed Consultation Check",
  },
  PASSED_CONSULTATION_CHECK: {
    value: "PASSED_CONSULTATION_CHECK",
    label: "Passed Consultation Check",
  },
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
  },
  SATISFIED: {
    value: "SATISFIED",
    label: "Satisfied",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
};

export const PROPONENT_SUBMISSION_ITEM_FILTERS: Partial<
  Record<SubmissionItemStatus, { value: SubmissionItemStatus; label: string }>
> = {
  NEW: {
    value: "NEW",
    label: "New",
  },
  UPDATED: {
    value: "UPDATED",
    label: "Updated",
  },
  UPDATE_REQUESTED: {
    value: "UPDATE_REQUESTED",
    label: "Update Requested",
  },
  REVISION_REQUIRED: {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
  },
  PARTIALLY_COMPLETED: {
    value: "PARTIALLY_COMPLETED",
    label: "Partially Completed",
  },
  SUBMITTED: {
    value: "SUBMITTED",
    label: "Submitted",
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completed",
  },
  PASSED_CONSULTATION_CHECK: {
    value: "PASSED_CONSULTATION_CHECK",
    label: "Passed Consultation Check",
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  SATISFIED: {
    value: "SATISFIED",
    label: "Satisfied",
  },
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
  },
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
