import { Note } from "@/components/SubmissionItem/Note";
import { Submission, SubmissionItemStatus } from "./Submission";
import { SubmissionReview } from "./SubmissionReview";

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

export const SUBMISSION_ITEM_TYPE: Record<string, SubmissionItemTypeName> =
  Object.freeze({
    CONTACT_INFORMATION: "Contact Information Form",
    MANAGEMENT_PLAN: "Management Plan",
    CONSULTATION_RECORD: "Consultation Record(s)",
  });

export const SUBMISSION_ITEM_MODAL_CONTENT: Record<
  string,
  { title: string; description: string; confirmText: string }
> = {
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: {
    title: "Start Management Plan Review",
    description:
      "Would you like to start the Management Plan review now? This will start the counter for the MP Review.",
    confirmText: "Start MP Review",
  },
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: {
    title: "Start Consultation Check",
    description: "Would you like to start the Consultation Check now?",
    confirmText: "Start Consultation Check",
  },
};

export interface SubmissionItem {
  id: number;
  package_id: number;
  sort_order: number;
  status: SubmissionItemStatus;
  submitted_by: string;
  submitted_on: string;
  type: SubmissionItemType;
  type_id: number;
  version: number;
  submissions: Submission[];
  internal_staff_documents?: InternalStaffDocument[];
  review?: SubmissionReview;
  notes?: Note[];
  review_start_date?: string;
}

export type InternalStaffDocumentType = "S3" | "LINK";
export const INTERNAL_STAFF_DOCUMENT_TYPE = Object.freeze<
  Record<InternalStaffDocumentType, InternalStaffDocumentType>
>({
  S3: "S3",
  LINK: "LINK",
});
export type InternalStaffDocument = {
  id: number;
  name: string;
  url: string;
  type: InternalStaffDocumentType;
  item_id: number;
  created_by: string;
  created_date: string;
};
