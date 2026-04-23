import { SubmissionPackage, SubmissionPackageMeta } from "@/models/Package";
import {
  SUBMISSION_ITEM_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";

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
  };
}) => {
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
  
  // Required items must be completed
  const isSubmissionItemCompleted =
    submissionItem.status === SUBMISSION_ITEM_STATUS.COMPLETED.value;
  return isSubmissionItemCompleted;
};

export const getConditionFromPackageMeta = (
  submissionPackageMeta: SubmissionPackageMeta,
) => {
  const condition = submissionPackageMeta?.main_condition;

  return condition;
};
