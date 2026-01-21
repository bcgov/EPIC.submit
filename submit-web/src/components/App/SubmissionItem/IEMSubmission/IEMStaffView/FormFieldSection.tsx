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
import { IemSubmissionForm } from "@/components/App/SubmissionItem/IEMSubmission/IEMProponentView/constants";

const defaultFormData = {
  conditionSatisfied: "",
  allRequirementsAddressed: "",
  informationAccurate: "",
  notes: "",
};

type FormFieldSectionProps = Readonly<{
  formData: Partial<IemSubmissionForm>; // Replace FormValues with your actual form schema interface
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
      <Grid item xs={12}>
        <Grid
          item
          container
          xs={12}
          justifyContent={"space-between"}
          alignItems={"space-between"}
          sx={{ borderBottom: `2px solid ${BCDesignTokens.themeGold80}` }}
        >
          <Typography
            variant="h4"
            color={BCDesignTokens.themeBlue100}
            sx={{
              mt: BCDesignTokens.layoutMarginSmall,
            }}
          >
            Independent Environmental Monitor Terms of Engagement Requirements
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
      <Grid item xs={12} container>
        <When condition={!isHidden}>
          <Grid item xs={12} container>
            <Grid item xs={12}>
              <Typography variant="body1">
                Does the Independent Environmental Monitor Terms of Engagement
                address all the requirements in condition
                {` ${condition}`}?
              </Typography>
              <RadioGroup value={mergedFormData.conditionSatisfied}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                If the condition(s) associated with the Independent
                Environmental Monitor Terms of Engagement reference other
                documents, in whole or part (e.g., project application
                sections), does the Independent Environmental Monitor Terms of
                Engagement address all requirements within the referenced
                document(s)?
              </Typography>
              <RadioGroup value={mergedFormData.allRequirementsAddressed}>
                <YesNoRadioOptions disabled error={false} />
              </RadioGroup>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <BarBlueTitle title="Information Verification" />
          </Grid>
          <Grid item xs={12} sx={{ mt: 1 }}>
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
