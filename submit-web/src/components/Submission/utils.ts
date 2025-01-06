import { SubmissionPackage } from "@/models/Package";
import { SUBMISSION_STATUS, SubmissionStatus } from "@/models/Submission";

export const isSubmissionItemReadyToSubmit = ({
  submissionItem,
  submissionPackage,
}: {
  submissionPackage: SubmissionPackage;
  submissionItem: {
    id: number;
    status: SubmissionStatus;
  };
}) => {
  if (
    submissionPackage.submitted_on &&
    submissionPackage.update_requests.length > 0
  ) {
    return true;
  }
  const isSubmissionItemCompleted =
    submissionItem.status === SUBMISSION_STATUS.COMPLETED.value;
  return isSubmissionItemCompleted;
};
