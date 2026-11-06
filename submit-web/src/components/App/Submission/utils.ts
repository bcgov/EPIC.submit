import { SubmissionPackage, SubmissionPackageMeta } from "@/models/Package";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_SORT_ORDER,
  SUBMISSION_TYPE,
  Submission,
  SubmissionItemStatus,
} from "@/models/Submission";

const getSectionDocumentLabel = (name: string) =>
  ({
    "Initial Project Description": "IPD",
    "Geospatial Information": "GIS",
  })[name] ?? name;

export const getMissingMainDocumentMessage = (
  item: {
    type: { name: string; submission_method?: string };
    is_required?: boolean;
    submissions?: Submission[];
  },
) => {
  if (
    item.is_required === false ||
    item.type.submission_method !== "DOCUMENT_UPLOAD"
  ) {
    return undefined;
  }

  const hasMainDocument = (item.submissions ?? []).some(
    (submission) =>
      submission.type === SUBMISSION_TYPE.DOCUMENT &&
      submission.sort_order === SUBMISSION_SORT_ORDER.MAIN_DOCUMENT,
  );
  if (hasMainDocument) return undefined;

  return `You must have at least one file uploaded in this section (section/document name:  ${getSectionDocumentLabel(item.type.name)}) to be able to submit your package`;
};

// Lower sort_order values come first; upload time keeps files within a group predictable.
export const orderDocumentsBySortOrder = (submissions: Submission[]) =>
  submissions
    .map((submission, index) => ({ submission, index }))
    .sort(
      ({ submission: a, index: aIndex }, { submission: b, index: bIndex }) => {
        const sortOrderDifference =
          (a.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT) -
          (b.sort_order ?? SUBMISSION_SORT_ORDER.SUPPORTING_DOCUMENT);
        if (sortOrderDifference) return sortOrderDifference;

        const aCreatedDate = Date.parse(a.created_date);
        const bCreatedDate = Date.parse(b.created_date);
        const dateDifference =
          (Number.isNaN(aCreatedDate) ? 0 : aCreatedDate) -
          (Number.isNaN(bCreatedDate) ? 0 : bCreatedDate);
        return dateDifference || aIndex - bIndex;
      },
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
