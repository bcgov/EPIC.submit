import { LabelValuePair } from "@/components/Shared/Text/LabelValuePair";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import { SUBMISSION_ITEM_STATUS } from "@/models/Submission";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
  SubmissionReview,
} from "@/models/SubmissionReview";
import { Grid, Stack, Typography, Box, styled } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import dayjs from "dayjs";

const NeutralBox = styled(Box)({
  border: `1px solid ${BCDesignTokens.surfaceColorBorderMedium}`,
  borderRadius: "4px",
  display: "flex",
  alignItems: "flex-start",
  alignSelf: "stretch",
  color: "#313132",
  backgroundColor: BCDesignTokens.surfaceColorSecondaryButtonDisabled,
  padding: "10px 10px 10px 12px",
  flexDirection: "column",
  gap: "4px",
});

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

  const isNotApplicable =
    managerConfirmation?.entry?.passedConsultationCheck === "NOT_APPLICABLE";

  const passedConsultationCheck =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.APPROVED
      ? isNotApplicable
        ? "NOT_APPLICABLE"
        : SUBMISSION_ITEM_STATUS.PASSED_CONSULTATION_CHECK.value
      : undefined;
  const failedConsultationCheck =
    submissionReview.status === SUBMISSION_REVIEW_STATUS.REJECTED
      ? SUBMISSION_ITEM_STATUS.FAILED_CONSULTATION_CHECK.value
      : undefined;

  const BoxContainer = isNotApplicable ? NeutralBox : SuccessBox;

  return (
    <BoxContainer data-testid="review-completed-notification" sx={{
      m: "2em 0"
    }}>
      <Stack direction="row" spacing={2} sx={{
        alignItems: "center"
      }}>
        <Typography variant="body1" sx={{
          color: "inherit"
        }}>
          The Consultation Check was confirmed as:
        </Typography>
        <SubmissionStatusChip
          status={passedConsultationCheck ?? failedConsultationCheck}
        />
      </Stack>
      <Grid container sx={{
        color: "inherit"
      }}>
        <Grid container size={12}>
          <Grid container sx={{
            width: "400px"
          }}>
            <Grid size={12}>
              <LabelValuePair
                label="Decision recommended by"
                value={staffRecommendation?.updated_by ?? ""}
                labelProps={{ color: "inherit", sx: { width: "220px" } }}
              />
            </Grid>
            <Grid size={12}>
              <LabelValuePair
                label="Confirmed by"
                value={managerConfirmation?.updated_by ?? ""}
                labelProps={{ color: "inherit", sx: { width: "220px" } }}
              />
            </Grid>
          </Grid>
          <Grid container size="grow">
            <Grid size={12}>
              <LabelValuePair
                label="Date"
                value={
                  staffRecommendation?.updated_date
                    ? dayjs(staffRecommendation.updated_date).format(
                        "DD-MMM-YYYY",
                      )
                    : ""
                }
                labelProps={{ color: "inherit", sx: { width: "50px" } }}
              />
            </Grid>
            <Grid size={12}>
              <LabelValuePair
                label="Date"
                value={
                  managerConfirmation?.updated_date
                    ? dayjs(managerConfirmation.updated_date).format(
                        "DD-MMM-YYYY",
                      )
                    : ""
                }
                labelProps={{ color: "inherit", sx: { width: "50px" } }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </BoxContainer>
  );
};
