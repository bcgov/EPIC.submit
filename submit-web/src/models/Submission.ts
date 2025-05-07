// NonCanonicalSubmissionStatus are just for display purpose, they are not canonical business statuses
export type NonCanonicalSubmissionStatus =
  | "PENDING_MANAGER_REVIEW"
  | "REVISION_REQUIRED"
  | "REVISION_REQUESTED"
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
  REVISION_REQUESTED: "REVISION_REQUESTED",
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
  | "APPROVED"
  | "REVIEWED"
  | "ACCEPTED"
  | "SATISFIED"
  | "UPDATE_REQUESTED"
  | "UPDATED"
  | "AWAITING_MANAGER_APPROVAL"
  | "REVISION_REQUESTED"
  | "NO_REVISION_REQUIRED";

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
  PARTIALLY_COMPLETED: {
    value: "PARTIALLY_COMPLETED",
    label: "Partially Completed",
  },
  SUBMITTED: {
    value: "SUBMITTED",
    label: "Submitted",
  },
  UPDATE_REQUESTED: {
    value: "UPDATE_REQUESTED",
    label: "Update Requested",
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
  COMPLETED: {
    value: "COMPLETED",
    label: "Completed",
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
  NO_REVISION_REQUIRED: {
    value: "NO_REVISION_REQUIRED",
    label: "No Revision Required",
  },
};

export const PROPONENT_SUBMISSION_ITEM_FILTERS: Partial<
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
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  NO_REVISION_REQUIRED: {
    value: "NO_REVISION_REQUIRED",
    label: "No Revision Required",
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
