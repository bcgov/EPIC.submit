import { SubmissionPackageType } from "./Package";
import { SUBMISSION_ITEM_TYPE } from "./SubmissionItem";
import { SUBMISSION_SORT_ORDER } from "@/models/Submission";

// Define each upload destination and its role here. Screens must reuse this
// priority so creating, updating, and moving a file agree on what is main.
export type UploadDestination = Readonly<{
  value: string;
  label: string;
  sortOrder: number;
}>;

export const DOCUMENT_UPLOAD_CONFIG = {
  MANAGEMENT_PLANS: {
    value: "management_plans",
    label: "Management Plans",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  SUPPORTING_DOCUMENTS: {
    value: "supporting_documents",
    label: "Supporting Documents",
    sortOrder: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
  },
  CONSULTATION_RECORDS: {
    value: "consultation_records",
    label: "Consultation Record(s)",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  IEMS: {
    value: "iems",
    label: "IEM",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  IPDS: {
    value: "ipds",
    label: "Initial Project Description",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  IPD_SUPPORTING_DOCUMENTS: {
    value: "ipd_supporting_documents",
    label: "IPD Supporting Documents",
    sortOrder: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
  },
  ENGAGEMENT_PLANS: {
    value: "engagement_plans",
    label: "Engagement Plans",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  ENGAGEMENT_PLAN_SUPPORTING_DOCUMENTS: {
    value: "engagement_plan_supporting_documents",
    label: "Engagement Plan Supporting Documents",
    sortOrder: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
  },
  GEOSPATIAL: {
    value: "geospatial",
    label: "Geospatial Information",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  UPLOAD_DOCUMENTS: {
    value: "upload_documents",
    label: "Upload Documents",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  REPORTS: {
    value: "reports",
    label: "Reports",
    sortOrder: SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  },
  REPORT_SUPPORTING_DOCUMENTS: {
    value: "report_supporting_documents",
    label: "Report Supporting Documents",
    sortOrder: SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT,
  },
} as const satisfies Record<string, UploadDestination>;

// Storage-only folders do not have a submission role or priority.
export const S3_FOLDER = {
  ...DOCUMENT_UPLOAD_CONFIG,
  SUBMISSIONS: { value: "submissions", label: "Submissions" },
  INTERNAL_STAFF_DOCUMENTS: {
    value: "internal_staff_documents",
    label: "Internal Staff Documents",
  },
} as const;

export type DocumentFolder = UploadDestination;

export const NEW_PACKAGE_TYPE_S3_FOLDER_MAP: Partial<
  Record<SubmissionPackageType, Record<string, DocumentFolder[]>>
> = {
  [SubmissionPackageType.MANAGEMENT_PLAN]: {
    [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: [
      DOCUMENT_UPLOAD_CONFIG.CONSULTATION_RECORDS,
    ],
    [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: [
      DOCUMENT_UPLOAD_CONFIG.MANAGEMENT_PLANS,
      DOCUMENT_UPLOAD_CONFIG.SUPPORTING_DOCUMENTS,
    ],
  },
  [SubmissionPackageType.IEM]: {
    [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: [
      DOCUMENT_UPLOAD_CONFIG.CONSULTATION_RECORDS,
    ],
    [SUBMISSION_ITEM_TYPE.IEM]: [
      DOCUMENT_UPLOAD_CONFIG.IEMS,
      DOCUMENT_UPLOAD_CONFIG.SUPPORTING_DOCUMENTS,
    ],
  },
};
