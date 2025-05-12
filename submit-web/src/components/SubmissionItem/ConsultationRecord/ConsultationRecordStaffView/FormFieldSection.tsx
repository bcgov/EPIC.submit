import {
  FormControlLabel,
  Grid,
  RadioGroup,
  Switch,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { ConsultationRecordForm } from "../constants";
import { useFormVisibilityStore } from "@/store/hideFormStore";
import { SubmissionPackageType } from "@/components/Shared/types";
import { useMemo } from "react";

const defaultFormData = {
  consultedParties: [],
  writtenExplanationsProvidedToCommenters: "",
  allPartiesConsulted: "",
  planWasReviewed: "",
  writtenExplanationsProvidedToParties: "",
  consultationRecords: [],
  notes: "",
};

type FormFieldSectionProps = Readonly<{
  formData: Partial<ConsultationRecordForm>;
  partiesList: Array<string>;
  submissionId: number;
  packageType: SubmissionPackageType;
}>;

export default function FormFieldSection({
  formData = defaultFormData,
  partiesList,
  submissionId,
  packageType,
}: FormFieldSectionProps) {
  const { getFormVisibility, setFormVisibility } = useFormVisibilityStore();
  const isHidden = getFormVisibility(submissionId);
  const mergedFormData = { ...defaultFormData, ...formData };

  const MANAGEMENT_PLAN = useMemo(() => {
    if (packageType === SubmissionPackageType.MANAGEMENT_PLAN) {
      return "Management Plan";
    }
    if (packageType === SubmissionPackageType.IEM) {
      return "Independent Environmental Monitor Terms of Engagement";
    }
    return "";
  }, [packageType]);

  const PLAN = useMemo(() => {
    if (packageType === SubmissionPackageType.MANAGEMENT_PLAN) {
      return "plan";
    }
    if (packageType === SubmissionPackageType.IEM) {
      return "Independent Environmental Monitor Terms of Engagement";
    }
    return "";
  }, [packageType]);

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
            Consultation Records Information
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isHidden}
                onChange={() => setFormVisibility(submissionId, !isHidden)}
              />
            }
            label="Hide form"
          />
        </Grid>
      </Grid>
      <Grid item xs={12} container>
        <When condition={!isHidden}>
          <Grid
            item
            container
            xs={12}
            spacing={BCDesignTokens.layoutMarginSmall}
          >
            <Grid item xs={12}>
              <Typography
                variant="body1"
                fontWeight={BCDesignTokens.typographyFontWeightsBold}
              >
                Names of consulted/engaged parties
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                These parties have been identified as requiring consultation.
                Please include any additional parties that have been consulted
                while developing this {MANAGEMENT_PLAN}.
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              <ul
                style={{
                  marginLeft: BCDesignTokens.layoutMarginSmall,
                  paddingLeft: BCDesignTokens.layoutPaddingSmall,
                }}
              >
                {partiesList.map((stakeholder, index) => (
                  <li key={index}>{stakeholder}</li>
                ))}
                <When condition={mergedFormData?.consultedParties.length > 0}>
                  {mergedFormData?.consultedParties?.map((field, index) => (
                    <li key={index}>{field.consultedParty}</li>
                  ))}
                </When>
              </ul>
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Ensure that comment trackers clearly demonstrate that consulted
              parties have had the opportunity to respond to holder responses to
              the consulted parties comments.
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Were all parties listed above consulted/engaged on the development
              of this {PLAN}?
            </Typography>
            <RadioGroup value={mergedFormData.allPartiesConsulted}>
              <YesNoRadioOptions disabled error={false} />
            </RadioGroup>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Was the {PLAN} provided to all parties listed above for review and
              comment during {PLAN} development?
            </Typography>
            <RadioGroup value={mergedFormData.planWasReviewed}>
              <YesNoRadioOptions disabled error={false} />
            </RadioGroup>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Have written explanations been provided to each party listed above
              on how comments were fully and impartially considered and
              addressed in the {PLAN}?
            </Typography>
            <RadioGroup
              value={mergedFormData.writtenExplanationsProvidedToParties}
            >
              <YesNoRadioOptions disabled error={false} />
            </RadioGroup>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              For comments not addressed in this {PLAN}, have written
              explanations been provided to the commenters as to why the
              comments were not addressed?
            </Typography>
            <RadioGroup
              value={mergedFormData.writtenExplanationsProvidedToCommenters}
            >
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
