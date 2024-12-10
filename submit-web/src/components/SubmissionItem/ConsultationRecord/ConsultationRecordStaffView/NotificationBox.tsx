import { LabelValuePair } from "@/components/Shared/LabelValuePair";
import { checkIfStaff } from "@/components/Shared/PermissionGate/utils";
import { SuccessBox } from "@/components/Shared/SuccessBox";
import { SubmissionStatusChip } from "@/components/SubmissionStatusChip";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { SUBMISSION_STATUS } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
} from "@/models/SubmissionReview";
import { useAccount } from "@/store/accountStore";
import { Grid, Stack, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import dayjs from "dayjs";

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
  const staffRecommendation = submissionReview?.entries?.find(
    (entry) => entry.type === SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION,
  );
  const managerConfirmation = submissionReview?.entries?.find(
    (entry) => entry.type === SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
  );

  const isStaff = checkIfStaff(roles);

  if (!submissionReview) {
    return <></>;
  }

  if (
    isStaff &&
    submissionReview.status === SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW
  ) {
    return (
      <SuccessBox m="2em 0">
        <Typography variant="body1" color="inherit">
          Your recommendation has been successfully sent to a Manager
        </Typography>
      </SuccessBox>
    );
  }

  if (submissionReview.status === SUBMISSION_REVIEW_STATUS.APPROVED) {
    return (
      <SuccessBox m="2em 0">
        <Stack direction="row" alignItems={"center"} spacing={2}>
          <Typography variant="body1" color="inherit">
            The submission has been completed as:
          </Typography>
          <SubmissionStatusChip
            status={SUBMISSION_STATUS.PASSED_CONSULTATION_CHECK.value}
          />
        </Stack>
        <Grid container color={"inherit"}>
          <Grid item xs={12} container>
            <Grid item container width="400px">
              <Grid item xs={12}>
                <LabelValuePair
                  label="Decision recommended by"
                  value={""}
                  labelProps={{ color: "inherit", width: "220px" }}
                />
              </Grid>
              <Grid item xs={12}>
                <LabelValuePair
                  label="Confirmed by"
                  value=""
                  labelProps={{ color: "inherit", width: "220px" }}
                />
              </Grid>
            </Grid>
            <Grid item xs container>
              <Grid item xs={12}>
                <LabelValuePair
                  label="Date"
                  value={
                    staffRecommendation?.updated_date
                      ? dayjs(staffRecommendation.updated_date).format(
                          "DD-MMM-YYYY",
                        )
                      : ""
                  }
                  labelProps={{ color: "inherit", width: "50px" }}
                />
              </Grid>
              <Grid item xs={12}>
                <LabelValuePair
                  label="Date"
                  value={
                    managerConfirmation?.updated_date
                      ? dayjs(managerConfirmation.updated_date).format(
                          "DD-MMM-YYYY",
                        )
                      : ""
                  }
                  labelProps={{ color: "inherit", width: "50px" }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </SuccessBox>
    );
  }

  return <></>;
};
