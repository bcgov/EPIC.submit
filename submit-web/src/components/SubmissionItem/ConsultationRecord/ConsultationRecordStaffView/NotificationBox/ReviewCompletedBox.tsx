import { LabelValuePair } from "@/components/Shared/LabelValuePair";
import { SuccessBox } from "@/components/Shared/SuccessBox";
import { SubmissionStatusChip } from "@/components/SubmissionStatusChip";
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

  const passedConsultationCheck =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.APPROVED
      ? SUBMISSION_ITEM_STATUS.PASSED_CONSULTATION_CHECK.value
      : undefined;
  const failedConsultationCheck =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.REJECTED
      ? SUBMISSION_ITEM_STATUS.FAILED_CONSULTATION_CHECK.value
      : undefined;

  return (
    <SuccessBox m="2em 0" data-testid="review-completed-notification">
      <Stack direction="row" alignItems={"center"} spacing={2}>
        <Typography variant="body1" color="inherit">
          The Consultation Check was completed as:
        </Typography>
        <SubmissionStatusChip
          status={passedConsultationCheck ?? failedConsultationCheck}
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
    </SuccessBox>
  );
};
