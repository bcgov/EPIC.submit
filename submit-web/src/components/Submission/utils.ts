import { SubmissionPackage } from "@/models/Package";
import {
  SUBMISSION_ITEM_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import dayjs from "dayjs";

export const isSubmissionItemReadyToSubmit = ({
  submissionItem,
  submissionPackage,
}: {
  submissionPackage: SubmissionPackage;
  submissionItem: {
    id: number;
    status: SubmissionItemStatus;
  };
}) => {
  if (
    submissionPackage.submitted_on &&
    submissionPackage.update_requests.length > 0
  ) {
    return true;
  }
  const isSubmissionItemCompleted =
    submissionItem.status === SUBMISSION_ITEM_STATUS.COMPLETED.value;
  return isSubmissionItemCompleted;
};

// export const isSubmissionUpdated = ({
//   packageSubmissionDate,
//   submissionItem,
// }: {
//   packageSubmissionDate: string;
//   submissionItem: SubmissionItem;
// }) => {
//   return submissionItem.submissions.find((submission) =>
//     dayjs(submission.created_date).isAfter(dayjs(packageSubmissionDate)),
//   );
// };
