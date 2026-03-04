import { Note } from "@/components/App/SubmissionItem/Note";
import { Submission, SubmissionItemStatus } from "./Submission";
import { SubmissionReview } from "./SubmissionReview";
import { User } from "./User";

export enum SubmissionItemMethod {
  FORM_SUBMISSION = "FORM_SUBMISSION",
  DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD",
}

export type SubmissionItemType = {
  id: number;
  name: SUBMISSION_ITEM_TYPE;
  submission_method: SubmissionItemMethod;
};

export enum SUBMISSION_ITEM_TYPE {
  CONTACT_INFORMATION = "Submission Contact Information",
  MANAGEMENT_PLAN = "Management Plan",
  CONSULTATION_RECORD = "Consultation Record(s)",
  IEM = "IEM Terms of Engagement",
  IPD = "Initial Project Description",
  ENGAGEMENT_PLAN = "Engagement Plan",
  GEOSPATIAL_INFORMATION = "Geospatial Information",
}

export const SubmissionItemTypeLabelMap = {
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: "Submission Contact Information",
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: "Management Plan",
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: "Consultation Record(s)",
  [SUBMISSION_ITEM_TYPE.IEM]:
    "Independent Environmental Monitor Terms of Engagement",
  [SUBMISSION_ITEM_TYPE.IPD]: "Initial Project Description",
  [SUBMISSION_ITEM_TYPE.ENGAGEMENT_PLAN]: "Engagement Plan",
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: "Geospatial Information",
};

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
  created_by_user: User;
};
