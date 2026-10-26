import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import {
  FormControlLabel,
  Grid,
  RadioGroup,
  Switch,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { useFormVisibilityStore } from "@/store/hideFormStore";
import { useMemo } from "react";
import { get } from "lodash";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";
import { useParams } from "@tanstack/react-router";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { ManagementPlanSubmissionForm } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanProponentView/constants";

const defaultFormData = {
  conditionSatisfied: "",
  allRequirementsAddressed: "",
  informationAccurate: "",
  notes: "",
};

type FormFieldSectionProps = Readonly<{
  formData: Partial<ManagementPlanSubmissionForm>; // Replace FormValues with your actual form schema interface
}>;

export default function FormFieldSection({ formData }: FormFieldSectionProps) {
  const {
    projectId: accountProjectIdParam,
    submissionId: submissionItemId,
    submissionPackageId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const mergedFormData = { ...defaultFormData, ...formData };
  const { getFormVisibility, setFormVisibility } = useFormVisibilityStore();
  const isHidden = getFormVisibility(Number(submissionItemId));
  const { data: submissionPackage } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
    enabled: Boolean(accountProjectIdParam),
  });

  const condition = useMemo(() => {
    if (!submissionPackage?.meta) return "";
    const condition = get(submissionPackage, "meta.main_condition");

    return get(condition, "condition_number", "");
  }, [submissionPackage]);

  return (
    <>
      <Grid size={12}>
        <Grid
          container
          size={12}
          sx={{
            justifyContent: "space-between",
            alignItems: "space-between",
            borderBottom: `2px solid ${BCDesignTokens.themeGold80}`
          }}>
          <Typography
            variant="h4"
            color={BCDesignTokens.themeBlue100}
            sx={{
              mt: BCDesignTokens.layoutMarginSmall,
            }}
          >
            Management Plan Requirements
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isHidden}
                onChange={() =>
                  setFormVisibility(Number(submissionItemId), !isHidden)
                }
              />
            }
            label="Hide form"
          />
        </Grid>
      </Grid>
      <Grid container size={12}>
        <When condition={!isHidden}>
          <Grid container size={12}>
            <Grid size={12}>
              <Typography variant="body1">
                Does the plan address all the requirements in condition
                {` ${condition}`}?
              </Typography>
              <RadioGroup value={mergedFormData.conditionSatisfied}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
            </Grid>
            <Grid size={12}>
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
          </Grid>
          <Grid size={12}>
            <BarBlueTitle title="Information Verification" />
          </Grid>
          <Grid sx={{ mt: 1 }} size={12}>
            <Typography variant="body1">
              The information on this form is correct to the best of your
              knowledge.
            </Typography>
            <RadioGroup value={mergedFormData.informationAccurate}>
              <YesNoRadioOptions disabled error={false} />
            </RadioGroup>
          </Grid>
          <Grid sx={{ mb: BCDesignTokens.layoutMarginMedium }} size={12}>
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
