import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import {
  Divider,
  FormControlLabel,
  Grid,
  RadioGroup,
  Switch,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { ManagementPlanSubmissionForm } from "../ManagementPlanStaffView";
import { useState } from "react";
import { When } from "react-if";

const defaultFormData = {
  conditionSatisfied: "",
  allRequirementsAddressed: "",
  requirementsClear: "",
  informationAccurate: "",
};

interface FormFieldSectionProps {
  formData: ManagementPlanSubmissionForm; // Replace FormValues with your actual form schema interface
}

export default function FormFieldSection({ formData }: FormFieldSectionProps) {
  const [isHidden, setIsHidden] = useState(false);
  const mergedFormData = { ...defaultFormData, ...formData };

  return (
    <>
      <Grid item xs={12}>
        <Grid
          item
          container
          xs={12}
          justifyContent={"space-between"}
          alignItems={"space-between"}
        >
          <Typography
            variant="h5"
            fontWeight={400}
            sx={{ color: BCDesignTokens.typographyColorDisabled }}
          >
            Management Plan Requirements
          </Typography>
          <FormControlLabel
            control={<Switch onChange={() => setIsHidden(!isHidden)} />}
            label="Hide form"
          />
        </Grid>
        <Divider sx={{ width: 1, mt: BCDesignTokens.layoutMarginXsmall }} />
      </Grid>
      <Grid item xs={12} container>
        <When condition={!isHidden}>
          <Grid item xs={12} container>
            <Grid item xs={12}>
              <Typography variant="body1">
                Does the plan address all the requirements in the (condition
                number)?
              </Typography>
              <RadioGroup value={mergedFormData.conditionSatisfied}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                If the condition(s) associated with the plan reference other
                documents, in whole or part (e.g., project application
                sections), does the plan address all requirements within the
                referenced document(s)?
              </Typography>
              <RadioGroup value={mergedFormData.allRequirementsAddressed}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                Is each requirement in the plan clear, measurable, and/or
                include accountability?
              </Typography>
              <RadioGroup value={mergedFormData.requirementsClear}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
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
              The information on this form is correct to the best of your
              knowledge.
            </Typography>
            <RadioGroup value={mergedFormData.informationAccurate}>
              <YesNoRadioOptions disabled error={false} />
            </RadioGroup>
          </Grid>
        </When>
      </Grid>
    </>
  );
}
