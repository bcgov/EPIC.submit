import { Submission, SubmissionStatus } from "./Submission";

type SubmissionItemTypeName =
  | "Contact Information Form"
  | "Management Plan"
  | "Consultation Record(s)";

type SubmissionItemMethod = "FORM_SUBMISSION" | "DOCUMENT_UPLOAD";
export const SUBMISSION_ITEM_METHOD: Record<
  SubmissionItemMethod,
  SubmissionItemMethod
> = Object.freeze({
  FORM_SUBMISSION: "FORM_SUBMISSION",
  DOCUMENT_UPLOAD: "DOCUMENT_UPLOAD",
});
export type SubmissionItemType = {
  id: number;
  name: SubmissionItemTypeName;
  submission_method: SubmissionItemMethod;
};

export const SUBMISSION_ITEM_TYPE: Record<string, SubmissionItemTypeName> = {
  CONTACT_INFORMATION: "Contact Information Form",
  MANAGEMENT_PLAN: "Management Plan",
  CONSULTATION_RECORD: "Consultation Record(s)",
};

export interface SubmissionItem {
  id: number;
  package_id: number;
  sort_order: number;
  status: SubmissionStatus;
  submitted_by: string;
  submitted_on: string;
  type: SubmissionItemType;
  type_id: number;
  version: number;
  submissions: Submission[];
}
