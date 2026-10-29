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

  // Body-black text (#2d2d2d) overrides the SuccessBox's green inherited
  // colour, and the extra vertical padding adds breathing room above and
  // below the banner content per the Figma frame. The green background and
  // border come from SuccessBox and are left unchanged.
  const bannerTextColor = "#2d2d2d";

  return (
    <BoxContainer
      sx={{ m: "2em 0", color: bannerTextColor, padding: "16px 12px 16px 8px" }}
      data-testid="review-completed-notification"
    >
      <Stack direction="row" spacing={2} sx={{
        alignItems: "center"
      }}>
        <Typography variant="body1" color={bannerTextColor}>
          The Consultation Check was confirmed as:
        </Typography>
        <SubmissionStatusChip
          status={passedConsultationCheck ?? failedConsultationCheck}
        />
      </Stack>
      <Grid container sx={{
        color: bannerTextColor
      }}>
        <Grid container size={12}>
          <Grid container sx={{
            width: "520px"
          }}>
            <Grid size={12}>
              <LabelValuePair
                label="Decision recommended by"
                value={staffRecommendation?.updated_by ?? ""}
                labelProps={{
                  color: bannerTextColor,
                  sx: { width: "220px", flexShrink: 0 },
                }}
                valueProps={{ color: bannerTextColor, noWrap: true }}
              />
            </Grid>
            <Grid size={12}>
              <LabelValuePair
                label="Confirmed by"
                value={managerConfirmation?.updated_by ?? ""}
                labelProps={{
                  color: bannerTextColor,
                  sx: { width: "220px", flexShrink: 0 },
                }}
                valueProps={{ color: bannerTextColor, noWrap: true }}
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
                labelProps={{
                  color: bannerTextColor,
                  sx: { width: "50px", flexShrink: 0 },
                }}
                valueProps={{ color: bannerTextColor, noWrap: true }}
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
                labelProps={{
                  color: bannerTextColor,
                  sx: { width: "50px", flexShrink: 0 },
                }}
                valueProps={{ color: bannerTextColor, noWrap: true }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </BoxContainer>
  );
};
