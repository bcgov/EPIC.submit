import { LabelValuePair } from "@/components/Shared/Text/LabelValuePair";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import { SUBMISSION_ITEM_STATUS } from "@/models/Submission";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
  SubmissionReview,
} from "@/models/SubmissionReview";
import { Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

type NotificationBoxProps = {
  submissionReview: SubmissionReview;
};
export const ReviewCompletedNotification = ({
  submissionReview,
}: NotificationBoxProps) => {
  const staffRecommendation = submissionReview?.entries?.find(
    (entry) => entry.type === SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION,
  );
  const managerConfirmation = submissionReview?.entries?.find(
    (entry) => entry.type === SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
  );

  const passedManagementPlanReview =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.APPROVED
      ? SUBMISSION_ITEM_STATUS.APPROVED.value
      : undefined;
  const failedManagementPlanReview =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.REJECTED
      ? SUBMISSION_ITEM_STATUS.REVIEW_REJECTED.value
      : undefined;
  const revisionRequired =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.REVISION_REQUIRED
      ? SUBMISSION_ITEM_STATUS.REVISION_REQUIRED.value
      : undefined;

  const BoxContainer = revisionRequired ? WarningBox : SuccessBox;

  return (
    <BoxContainer m="2em 0">
      <Stack direction="row" alignItems={"center"} spacing={2}>
        <Typography variant="body1" color="inherit">
          The Management Plan Review was confirmed as:
        </Typography>
        <SubmissionStatusChip
          status={
            passedManagementPlanReview ??
            failedManagementPlanReview ??
            revisionRequired
          }
        />
      </Stack>
      <Grid container color={"inherit"}>
        <Grid item xs={12} container>
          <Grid item container width="400px">
            <Grid item xs={12}>
              <LabelValuePair
                label="Decision recommended by"
                value={staffRecommendation?.updated_by ?? ""}
                labelProps={{ color: "inherit", width: "220px" }}
              />
            </Grid>
            <Grid item xs={12}>
              <LabelValuePair
                label="Confirmed by"
                value={managerConfirmation?.updated_by ?? ""}
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
    </BoxContainer>
  );
};
