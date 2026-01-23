import { useMemo, useState } from "react";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";
import {
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { BCDesignTokens } from "epic.theme";
import ControlledRadioGroup from "@/components/Shared/ControlledFormFields/ControlledRadioGroup";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { FieldErrors, useFieldArray, UseFormReturn } from "react-hook-form";
import { ConsultationRecordForm } from "@/components/App/SubmissionItem/ConsultationRecord/constants";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { SubmissionPackageType } from "@/components/Shared/types";

type FormFieldSectionProps = Readonly<{
  methods: UseFormReturn<ConsultationRecordForm>; // Replace FormValues with your actual form schema interface
  errors: FieldErrors<ConsultationRecordForm>; // Replace FormValues with your actual form schema interface
  partiesList: Array<string>;
  packageType: SubmissionPackageType;
}>;

export default function FormFieldSection({
  methods,
  errors,
  partiesList,
  packageType,
}: FormFieldSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "consultedParties", // this should match the field name in the schema
  });

  const [inputValue, setInputValue] = useState("");

  const handleAddParty = () => {
    const trimmedValue = inputValue.trim();
    if (
      trimmedValue &&
      !fields.some((field) => field.consultedParty === trimmedValue)
    ) {
      append({ consultedParty: trimmedValue });
      setInputValue("");
    }
  };

  const handleRemoveParty = (index: number) => {
    remove(index);
    methods.trigger("consultedParties");
  };

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
        <BarBlueTitle title="Consultation Records Information" />
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
              {fields
                .filter((field) => field.consultedParty?.trim())
                .map((field, index) => (
                  <li key={field.id}>
                    <Chip
                      label={field.consultedParty}
                      onDelete={() => handleRemoveParty(index)}
                      deleteIcon={<CloseIcon />}
                      sx={{
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        verticalAlign: "middle",
                        marginBottom: "5px",
                        backgroundColor:
                          BCDesignTokens.surfaceColorBackgroundLightBlue,
                        "& .MuiChip-deleteIcon": {
                          color: BCDesignTokens.surfaceColorBackgroundDarkBlue,
                          borderRadius: "0",
                          backgroundColor: "transparent",
                          marginLeft: "5px",
                          fontSize: "20px",
                        },
                      }}
                    />
                  </li>
                ))}
            </ul>
          </Typography>
          <Grid item container xs={12} spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                placeholder="Enter the name of other consulted party here"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim() !== "") {
                    handleAddParty();
                    e.preventDefault();
                  }
                }}
                InputProps={{
                  endAdornment:
                    inputValue && inputValue !== "" ? (
                      <InputAdornment
                        position="end"
                        sx={{ marginRight: "-5px" }}
                      >
                        <IconButton
                          onClick={handleAddParty}
                          sx={{
                            padding: 0,
                            borderRadius: "50%",
                            backgroundColor:
                              BCDesignTokens.surfaceColorBackgroundDarkBlue,
                            color: "white",
                            "&:hover": {
                              backgroundColor:
                                BCDesignTokens.surfaceColorBackgroundDarkBlue,
                            },
                          }}
                        >
                          <AddIcon
                            sx={{
                              fontSize: "20px",
                            }}
                          />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                }}
              />
            </Grid>
          </Grid>
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
          <ControlledRadioGroup name="allPartiesConsulted">
            <YesNoRadioOptions error={Boolean(errors["allPartiesConsulted"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            Was the {PLAN} provided to all parties listed above for review and
            comment during {PLAN} development?
          </Typography>
          <ControlledRadioGroup name="planWasReviewed">
            <YesNoRadioOptions error={Boolean(errors["planWasReviewed"])} />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            Have written explanations been provided to each party listed above
            on how comments were fully and impartially considered and addressed
            in the {PLAN}?
          </Typography>
          <ControlledRadioGroup name="writtenExplanationsProvidedToParties">
            <YesNoRadioOptions
              error={Boolean(errors["writtenExplanationsProvidedToParties"])}
            />
          </ControlledRadioGroup>
        </Grid>
        <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
          <Typography variant="body1">
            For comments not addressed in this {PLAN}, have written explanations
            been provided to the commenters as to why the comments were not
            addressed?
          </Typography>
          <ControlledRadioGroup name="writtenExplanationsProvidedToCommenters">
            <YesNoRadioOptions
              error={Boolean(errors["writtenExplanationsProvidedToCommenters"])}
            />
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
      </Grid>
    </>
  );
}
