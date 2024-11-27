import { Grid, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Unless } from "react-if";
import ActionButtons from "./ActionButtons";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { SubmissionItem } from "@/models/SubmissionItem";
import { useMemo } from "react";
import NotesSection from "./NotesSection";
import { consultationSchema } from "./constants";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { SUBMISSION_REVIEW_STATUS } from "@/models/SubmissionReview";

type ConsultationForm = yup.InferType<typeof consultationSchema>;

const YES_LABEL = "Yes, the holder has passed the Consultation Check";
const NO_LABEL = "No, the holder has failed the Consultation Check";

export default function ReviewSection() {
  const isStaff = true;

  const { submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(submissionItemId) })
      .queryKey,
  );
  const defaultValues = useMemo(() => {
    if (!submissionItem) return undefined;

    if (!submissionItem.review?.form_answers) return undefined;

    return submissionItem.review.form_answers;
  }, [submissionItem]);

  const methods = useForm<ConsultationForm>({
    resolver: yupResolver(consultationSchema),
    mode: "onChange",
    defaultValues,
  });

  const isFormDisabled =
    isStaff &&
    submissionItem?.review?.status ===
      SUBMISSION_REVIEW_STATUS.PENDING_MANAGER_REVIEW;

  return (
    <Grid item container>
      <Grid
        item
        xs={12}
        sx={{
          background: BCDesignTokens.themeBlue10,
          p: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        <FormProvider {...methods}>
          <form>
            <Typography variant="h6" color={"#858A8C"}>
              Consultation Check
            </Typography>
            <Divider
              sx={{
                bgcolor: BCDesignTokens.themeBlue60,
                width: 1,
                my: BCDesignTokens.layoutMarginXsmall,
              }}
            />
            <Typography
              variant="body1"
              sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
            >
              Based on the above information, has the holder passed the
              Consultation Check?
            </Typography>

            <ControlledRadioGroup name="staff.passedConsultationCheck">
              <SubmitRadio
                label={YES_LABEL}
                value={"yes"}
                disabled={isFormDisabled}
              />
              <SubmitRadio
                label={NO_LABEL}
                value={"no"}
                disabled={isFormDisabled}
              />
            </ControlledRadioGroup>
            <Unless condition={isStaff}>
              <Typography
                variant="body1"
                sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
              >
                MANAGER CONFIRMATION:
              </Typography>
              <ControlledRadioGroup name="manager.passedConsultationCheck">
                <SubmitRadio
                  label={YES_LABEL}
                  value={"yes"}
                  disabled={isFormDisabled}
                />
                <SubmitRadio
                  label={NO_LABEL}
                  value={"no"}
                  disabled={isFormDisabled}
                />
              </ControlledRadioGroup>
            </Unless>
            <NotesSection />
            <ActionButtons />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
