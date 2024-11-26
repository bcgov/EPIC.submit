import { Grid, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { When } from "react-if";
import ActionButtons from "./ActionButtons";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { SubmitRadio } from "@/components/Shared/SubmitRadio";
import { useSaveSubmissionReview } from "@/hooks/api/useItems";
import { useParams } from "@tanstack/react-router";

// Define Yup schema
const consultationSchema = yup.object().shape({
  staff: yup.object().shape({
    passed: yup.boolean().required(),
  }),
  manager: yup.object().shape({
    passed: yup.boolean().required(),
  }),
});

type ConsultationForm = yup.InferType<typeof consultationSchema>;

const YES_LABEL = "Yes, the holder has passed the Consultation Check";
const NO_LABEL = "No, the holder has failed the Consultation Check";

export default function ReviewSection() {
  const role = "staff"; // Replace with actual role
  const consultationSchema = yup.object().shape({
    staff: yup.object().shape({
      passed: yup.boolean().required(),
    }),
    manager: yup.object().shape({
      passed: yup.boolean().required(),
    }),
  });
  const methods = useForm<ConsultationForm>({
    resolver: yupResolver(consultationSchema),
    mode: "onSubmit",
  });

  const {
    projectId,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { mutate: saveSubmissionReview, isPending: isSavingSubmissionReview } =
    useSaveSubmissionReview({
      itemId: Number(submissionItemId),
      packageId: Number(submissionPackageId),
      accountProjectId: Number(projectId),
    });

  const { handleSubmit, getValues } = methods;

  const saveAndClose = () => {
    // Add save logic here
    const values = getValues();
  };

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
          <form onSubmit={handleSubmit(saveAndClose)}>
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
              <SubmitRadio label={YES_LABEL} value={true} />
              <SubmitRadio label={NO_LABEL} value={false} />
            </ControlledRadioGroup>
            <When condition={role !== "staff"}>
              <Typography
                variant="body1"
                sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
              >
                MANAGER CONFIRMATION:
              </Typography>
              <ControlledRadioGroup name="manager.passed">
                <SubmitRadio label={YES_LABEL} value={true} />
                <SubmitRadio label={NO_LABEL} value={false} />
              </ControlledRadioGroup>
            </When>
            <ActionButtons saveAndClose={saveAndClose} />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
