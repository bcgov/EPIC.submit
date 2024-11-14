export type SubmissionStatus =
  | "NEW_SUBMISSION"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "SUBMITTED";
export const SUBMISSION_STATUS: Record<
  SubmissionStatus,
  { value: SubmissionStatus; label: string }
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
