import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { Divider, Grid, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { FieldErrors, useFieldArray, UseFormReturn } from "react-hook-form";
import { ConsultationRecordForm } from "../constants";

interface FormFieldSectionProps {
  methods: UseFormReturn<ConsultationRecordForm>; // Replace FormValues with your actual form schema interface
  errors: FieldErrors<ConsultationRecordForm>; // Replace FormValues with your actual form schema interface
  partiesList: Array<string>;
}

export default function FormFieldSection({
  methods,
  errors,
  partiesList,
}: FormFieldSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "consultedParties", // this should match the field name in the schema
  });

  const handleAddParty = () => {
    append({ consultedParty: "" }); // append a new field for consultedParty
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography
          variant="h5"
          fontWeight={400}
          sx={{ color: BCDesignTokens.typographyColorDisabled }}
        >
          Consultation Records Information
        </Typography>
        <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
      </Grid>
      <Grid item xs={12} container>
        <Grid item container xs={12} spacing={BCDesignTokens.layoutMarginSmall}>
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
              while developing this Management Plan.
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
            </ul>
          </Typography>
          <Grid item container xs={12} spacing={2}>
            {fields.map((field, index) => (
              <Grid item container xs={12} key={field.id}>
                <Grid item xs={6}>
                  <ControlledTextField
                    fullWidth
                    name={`consultedParties.${index}.consultedParty`}
                    placeholder="Enter the name of other consulted party here"
                    sx={{
                      mb: 0,
                    }}
                  />
                </Grid>
                <When condition={fields.length > 1}>
                  <IconButton onClick={() => remove(index)}>
                    <CloseIcon />
                  </IconButton>
                </When>
              </Grid>
            ))}
          </Grid>
          <Typography
            variant="body1"
            sx={{
              color: BCDesignTokens.typographyColorLink,
              cursor: "pointer",
            }}
            onClick={handleAddParty}
          >
            + Add a Consulted Party
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
            of this plan?
          </Typography>
          <ControlledRadioGroup name="allPartiesConsulted">
            <YesNoRadioOptions error={Boolean(errors["allPartiesConsulted"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            Was the plan provided to all parties listed above for review and
            comment during plan development?
          </Typography>
          <ControlledRadioGroup name="planWasReviewed">
            <YesNoRadioOptions error={Boolean(errors["planWasReviewed"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            Have written explanations been provided to each party listed above
            on how comments were fully and impartially considered and addressed
            in the plan?
          </Typography>
          <ControlledRadioGroup name="writtenExplanationsProvidedToParties">
            <YesNoRadioOptions
              error={Boolean(errors["writtenExplanationsProvidedToParties"])}
            />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            For comments not addressed in this plan, have written explanations
            been provided to the commenters as to why the comments were not
            addressed?
          </Typography>
          <ControlledRadioGroup name="writtenExplanationsProvidedToCommenters">
            <YesNoRadioOptions
              error={Boolean(errors["writtenExplanationsProvidedToCommenters"])}
            />
          </ControlledRadioGroup>
        </Grid>
      </Grid>
    </>
  );
}
