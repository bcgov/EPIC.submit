import { SubmissionPackage, SubmissionPackageMeta } from "@/models/Package";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_TYPE,
  Submission,
  SubmissionItemStatus,
} from "@/models/Submission";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";

const PRIMARY_DOCUMENT_SECTIONS: Record<
  string,
  { folder: string; label: string }
> = {
  [SUBMISSION_ITEM_TYPE.IPD]: { folder: S3_FOLDER.IPDS.value, label: "IPD" },
  [SUBMISSION_ITEM_TYPE.ENGAGEMENT_PLAN]: {
    folder: S3_FOLDER.ENGAGEMENT_PLANS.value,
    label: "Engagement Plan",
  },
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: {
    folder: S3_FOLDER.GEOSPATIAL.value,
    label: "GIS",
  },
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: {
    folder: S3_FOLDER.MANAGEMENT_PLANS.value,
    label: "Management Plan",
  },
};

const SUPPORTING_DOCUMENT_FOLDERS = new Set([
  S3_FOLDER.IPD_SUPPORTING_DOCUMENTS.value,
  S3_FOLDER.ENGAGEMENT_PLAN_SUPPORTING_DOCUMENTS.value,
  S3_FOLDER.SUPPORTING_DOCUMENTS.value,
  S3_FOLDER.REPORT_SUPPORTING_DOCUMENTS.value,
]);
const MAIN_DOCUMENT_FOLDERS = new Set(
  [
    ...Object.values(PRIMARY_DOCUMENT_SECTIONS).map((section) => section.folder),
    S3_FOLDER.IEMS.value,
    S3_FOLDER.REPORTS.value,
  ],
);

const getDocumentOrder = (folder?: string) => {
  if (folder && MAIN_DOCUMENT_FOLDERS.has(folder)) return 0;
  if (folder && SUPPORTING_DOCUMENT_FOLDERS.has(folder)) return 1;
  return 2;
};

export const getMissingMainDocumentMessage = (
  item: {
    type: { name: string };
    is_required?: boolean;
    submissions?: Submission[];
  },
) => {
  if (item.is_required === false) return undefined;

  const section = PRIMARY_DOCUMENT_SECTIONS[item.type.name];
  if (!section) return undefined;

  const hasMainDocument = (item.submissions ?? []).some(
    (submission) =>
      submission.type === SUBMISSION_TYPE.DOCUMENT &&
      submission.submitted_document?.folder === section.folder,
  );
  if (hasMainDocument) return undefined;

  return `You must have at least one file uploaded in this section (section/document name:  ${section.label}) to be able to submit your package`;
};

export const orderMainDocumentsFirst = (submissions: Submission[]) =>
  submissions
    .map((submission, index) => ({ submission, index }))
    .sort(
      ({ submission: a, index: aIndex }, { submission: b, index: bIndex }) =>
        getDocumentOrder(a.submitted_document?.folder) -
          getDocumentOrder(b.submitted_document?.folder) ||
        aIndex - bIndex,
    )
    .map(({ submission }) => submission);

export const isSubmissionItemReadyToSubmit = ({
  submissionItem,
  submissionPackage,
}: {
  submissionPackage: SubmissionPackage;
  submissionItem: {
    id: number;
    status: SubmissionItemStatus;
    type: {
      id: number;
      name: string;
      submission_method: string;
    };
    is_required?: boolean;
    submissions?: Submission[];
  };
}) => {
  if (getMissingMainDocumentMessage(submissionItem)) {
    return false;
  }
  if (
    submissionPackage.submitted_on &&
    submissionPackage.update_requests.length > 0
  ) {
    return true;
  }
  // If item is optional (not required), it's always ready
  if (submissionItem.is_required === false) {
    return true;
  }
  
  // Required items must be completed or submitted
  const isSubmissionItemCompleted =
    submissionItem.status === SUBMISSION_ITEM_STATUS.COMPLETED.value ||
    submissionItem.status === SUBMISSION_ITEM_STATUS.SUBMITTED.value;
  return isSubmissionItemCompleted;
};

export const getConditionFromPackageMeta = (
  submissionPackageMeta: SubmissionPackageMeta,
) => {
  const condition = submissionPackageMeta?.main_condition;

  return condition;
};
