import { Grid, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { When } from "react-if";
import ActionButtons from "./ActionButtons";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { useQueryClient } from "@tanstack/react-query";
import { STAFF_QUERY_KEY } from "@/hooks/api/constants";
import { useParams } from "@tanstack/react-router";
import { SubmissionItem } from "@/models/SubmissionItem";
import { useMemo } from "react";
import NotesSection from "./NotesSection";

// Define Yup schema
export const consultationSchema = yup.object().shape({
  staff: yup.object().shape({
    passed: yup.string().required("Staff decision is required"),
  }),
  manager: yup.object().shape({
    passed: yup.string().required("Manager decision is required"),
  }),
});

type ConsultationForm = yup.InferType<typeof consultationSchema>;

const YES_LABEL = "Yes, the holder has passed the Consultation Check";
const NO_LABEL = "No, the holder has failed the Consultation Check";

export default function ReviewSection() {
  const role = "staff"; // Replace with actual role

  const { submissionId: submissionItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    STAFF_QUERY_KEY.SUBMISSION_ITEM,
    submissionItemId,
  ]);
  const defaultValues = useMemo(() => {
    if (!submissionItem) return {};

    if (!submissionItem.review?.form_answers) return {};

    return submissionItem.review.form_answers;
  }, [submissionItem?.review?.form_answers]);

  const methods = useForm<ConsultationForm>({
    resolver: yupResolver(consultationSchema),
    mode: "onChange",
    defaultValues,
  });

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

            <ControlledRadioGroup name="staff.passed">
              <SubmitRadio label={YES_LABEL} value={"true"} />
              <SubmitRadio label={NO_LABEL} value={"false"} />
            </ControlledRadioGroup>
            <When condition={role !== "staff"}>
              <Typography
                variant="body1"
                sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
              >
                MANAGER CONFIRMATION:
              </Typography>
              <ControlledRadioGroup name="manager.passed">
                <SubmitRadio label={YES_LABEL} value={"true"} />
                <SubmitRadio label={NO_LABEL} value={"false"} />
              </ControlledRadioGroup>
            </When>
            <NotesSection />
            <ActionButtons />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
