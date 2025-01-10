// NonCanonicalSubmissionStatus are just for display purpose, they are not canonical business statuses
export type NonCanonicalSubmissionStatus =
  | "PENDING_MANAGER_REVIEW"
  | "REVISION_REQUIRED"
  | "UPDATE_REQUESTED";

export const NON_CANONICAL_SUBMISSION_STATUS = Object.freeze<
  Record<NonCanonicalSubmissionStatus, NonCanonicalSubmissionStatus>
>({
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
});

export type SubmissionItemStatus =
  | "NEW_SUBMISSION"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "SUBMITTED"
  | "REVIEW_REJECTED"
  | "PASSED_CONSULTATION_CHECK";

export const SUBMISSION_STATUS: Record<
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

export type Submission = {
  id: number;
  item_id: number;
  version: number;
  type: SubmissionType;
  submitted_document: DocumentSubmission;
  submitted_form: SubmittedForm;
  created_date: string;
  submitted_by: string;
};
