import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ManagementPlanSubmissionForm } from "../ManagementPlanStaffView";
import { FieldErrors } from "react-hook-form";

interface FormFieldSectionProps {
  errors: FieldErrors<ManagementPlanSubmissionForm>; // Replace FormValues with your actual form schema interface
}

export default function FormFieldSection({ errors }: FormFieldSectionProps) {
  return (
    <>
      <Grid item xs={12} container>
        <Grid item xs={12}>
          <Typography variant="body1">
            Does the plan address all the requirements in the (condition
            number)?
          </Typography>

          <ControlledRadioGroup name="conditionSatisfied">
            <YesNoRadioOptions error={Boolean(errors["conditionSatisfied"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            If the condition(s) associated with the plan reference other
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
        <Grid item xs={12}>
          <Typography variant="body1">
            Is each requirement in the plan clear, measurable, and/or include
            accountability?
          </Typography>
          <ControlledRadioGroup name="requirementsClear">
            <YesNoRadioOptions error={Boolean(errors["requirementsClear"])} />
          </ControlledRadioGroup>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography
          variant="h5"
          fontWeight={400}
          sx={{ color: BCDesignTokens.typographyColorDisabled }}
        >
          Information Verification
        </Typography>
        <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">
          The information on this form is correct to the best of your knowledge.
        </Typography>
        <ControlledRadioGroup name="informationAccurate">
          <YesNoRadioOptions error={Boolean(errors["informationAccurate"])} />
        </ControlledRadioGroup>
      </Grid>
    </>
  );
}
