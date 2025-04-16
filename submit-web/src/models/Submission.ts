// NonCanonicalSubmissionStatus are just for display purpose, they are not canonical business statuses
export type NonCanonicalSubmissionStatus =
  | "PENDING_MANAGER_REVIEW"
  | "REVISION_REQUIRED"
  | "UPDATED"
  | "UPDATE_REQUESTED"
  | "NO_REVISION_REQUIRED"
  | "PREVIOUSLY_FAILED"
  | "FAILED";

export const NON_CANONICAL_SUBMISSION_STATUS = Object.freeze<
  Record<NonCanonicalSubmissionStatus, NonCanonicalSubmissionStatus>
>({
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  UPDATED: "UPDATED",
  FAILED: "FAILED",
  NO_REVISION_REQUIRED: "NO_REVISION_REQUIRED",
  PREVIOUSLY_FAILED: "PREVIOUSLY_FAILED",
});

export type SubmissionItemStatus =
  | "NEW_SUBMISSION"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "SUBMITTED"
  | "REVIEW_REJECTED"
  | "FAILED_CONSULTATION_CHECK"
  | "PASSED_CONSULTATION_CHECK"
  | "REVISION_REQUIRED"
  | "APPROVED";

export const SUBMISSION_ITEM_STATUS: Record<
  SubmissionItemStatus,
  { value: SubmissionItemStatus; label: string }
> = {
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
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
  FAILED_CONSULTATION_CHECK: {
    value: "FAILED_CONSULTATION_CHECK",
    label: "Failed Consultation Check",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  REVISION_REQUIRED: {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
  },
};

export const PROPONENT_SUBMISSION_ITEM_FILTERS: Record<
  SubmissionItemStatus,
  { value: SubmissionItemStatus; label: string }
> = {
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
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
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  REVISION_REQUIRED: {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
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
  | "PENDING";

export const SUBMISSION_STATUS = Object.freeze<
  Record<SubmissionStatus, SubmissionStatus>
>({
  SUBMITTED: "SUBMITTED",
  REJECTED: "REJECTED",
  APPROVED: "APPROVED",
  PENDING: "PENDING",
});

export type Submission = {
  id: number;
  item_id: number;
  version: string;
  minor_version: number;
  major_version: number;
  type: SubmissionType;
  submitted_document: DocumentSubmission;
  submitted_form?: SubmittedForm;
  created_date: string;
  submitted_by: string;
  status: SubmissionStatus;
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
