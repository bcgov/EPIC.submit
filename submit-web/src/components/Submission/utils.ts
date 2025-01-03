import { SUBMISSION_STATUS, SubmissionStatus } from "@/models/Submission";
import { UpdateRequest } from "@/models/UpdateRequest";

export const isSubmissionItemReadyToSubmit = ({
  submissionItem,
  updateRequests,
}: {
  updateRequests: UpdateRequest[];
  submissionItem: {
    id: number;
    status: SubmissionStatus;
  };
}) => {
  if (updateRequests.length > 0) {
    return true;
  }
  const isSubmissionItemCompleted =
    submissionItem.status === SUBMISSION_STATUS.COMPLETED.value;
  return isSubmissionItemCompleted;
};
