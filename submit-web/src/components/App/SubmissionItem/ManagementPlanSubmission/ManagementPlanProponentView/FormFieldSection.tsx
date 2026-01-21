import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FieldErrors, get } from "react-hook-form";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useParams } from "@tanstack/react-router";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";
import { useMemo } from "react";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { ManagementPlanSubmissionForm } from "./constants";

type FormFieldSectionProps = Readonly<{
  errors: FieldErrors<ManagementPlanSubmissionForm>;
}>;

export default function FormFieldSection({ errors }: FormFieldSectionProps) {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId: submissionPackageIdParam,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const submissionPackageId = Number(submissionPackageIdParam);
  const { data: submissionPackage } = useGetSubmissionPackage({
    packageId: submissionPackageId,
    enabled: Boolean(accountProjectId),
  });

  const condition = useMemo(() => {
    if (!submissionPackage?.meta) return "";
    const condition = get(submissionPackage, "meta.main_condition");

    return get(condition, "condition_number", "");
  }, [submissionPackage]);

  return (
    <>
      <Grid item xs={12} container>
        <Grid item xs={12}>
          <Typography variant="body1">
            Does the plan address all the requirements in condition
            {` ${condition}`}?
          </Typography>

          <ControlledRadioGroup name="conditionSatisfied">
            <YesNoRadioOptions error={Boolean(errors["conditionSatisfied"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            If the condition(s) associated with the plan references other
            documents, in whole or part (e.g., project application sections),
            does the plan address all requirements within the referenced
            document(s)?
          </Typography>
          <ControlledRadioGroup name="allRequirementsAddressed">
            <YesNoRadioOptions
              error={Boolean(errors["allRequirementsAddressed"])}
            />
          </ControlledRadioGroup>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <BarBlueTitle title="Information Verification" />
      </Grid>
      <Grid item xs={12} sx={{ mt: 1 }}>
        <Typography variant="body1">
          The information on this form is correct to the best of your knowledge.
        </Typography>
        <ControlledRadioGroup name="informationAccurate">
          <YesNoRadioOptions error={Boolean(errors["informationAccurate"])} />
        </ControlledRadioGroup>
      </Grid>
      <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Notes/Comments
        </Typography>
        <ControlledTextField
          fullWidth
          multiline
          minRows={4}
          name="notes"
          sx={{
            mb: 0,
          }}
        />
      </Grid>
    </>
  );
}
