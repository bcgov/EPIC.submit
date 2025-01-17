import { checkIfStaff } from "@/components/Shared/PermissionGate/utils";
import { SuccessBox } from "@/components/Shared/SuccessBox";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SUBMISSION_REVIEW_STATUS } from "@/models/SubmissionReview";
import { useAccount } from "@/store/accountStore";
import { Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Case, Switch } from "react-if";
import { ReviewCompletedNotification } from "./ReviewCompletedBox";

export const NotificationBox = () => {
  const queryClient = useQueryClient();
  const { roles } = useAccount();
  const { submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );

  const submissionReview = submissionItem?.review;

  const isStaff = checkIfStaff(roles);

  if (!submissionReview) {
    return <></>;
  }

  return (
    <Switch>
      <Case
        condition={[
          SUBMISSION_REVIEW_STATUS.APPROVED,
          SUBMISSION_REVIEW_STATUS.REJECTED,
        ].includes(submissionReview.status)}
      >
        <ReviewCompletedNotification submissionReview={submissionReview} />
      </Case>
      <Case
        condition={
          isStaff &&
          submissionReview.status ===
            SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW
        }
      >
        <SuccessBox m="2em 0">
          <Typography variant="body1" color="inherit">
            Your recommendation has been successfully sent to a Manager
          </Typography>
        </SuccessBox>
      </Case>
    </Switch>
  );
};
