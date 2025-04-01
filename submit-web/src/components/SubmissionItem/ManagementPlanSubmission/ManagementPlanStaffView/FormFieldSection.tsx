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
import { When } from "react-if";
import { useFormVisibilityStore } from "@/store/hideFormStore";
import { FORM_TYPE } from "@/store/hideFormStore";

const defaultFormData = {
  conditionSatisfied: "",
  allRequirementsAddressed: "",
  requirementsClear: "",
  informationAccurate: "",
  notes: "",
};

interface FormFieldSectionProps {
  formData: Partial<ManagementPlanSubmissionForm>; // Replace FormValues with your actual form schema interface
  submissionId: number;
}

export default function FormFieldSection({
  formData,
  submissionId,
}: FormFieldSectionProps) {
  const mergedFormData = { ...defaultFormData, ...formData };
  const { getFormVisibility, setFormVisibility } = useFormVisibilityStore();
  const isHidden = getFormVisibility(submissionId, FORM_TYPE.MANAGEMENT_PLAN);

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
            control={
              <Switch
                checked={isHidden}
                onChange={() =>
                  setFormVisibility(
                    submissionId,
                    FORM_TYPE.MANAGEMENT_PLAN,
                    !isHidden
                  )
                }
              />
            }
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
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Notes/Comments
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-wrap", // Ensures new lines are preserved
                wordBreak: "break-word", // Prevents text overflow
              }}
            >
              {mergedFormData.notes}
            </Typography>
          </Grid>
        </When>
      </Grid>
    </>
  );
}
