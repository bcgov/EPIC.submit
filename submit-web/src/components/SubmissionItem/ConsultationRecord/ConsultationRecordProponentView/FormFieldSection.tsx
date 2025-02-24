import { useState } from "react";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import {
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { BCDesignTokens } from "epic.theme";
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

  const [inputValue, setInputValue] = useState("");

  const handleAddParty = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !fields.some((field) => field.consultedParty === trimmedValue)) {
      append({ consultedParty: trimmedValue });
      setInputValue("");
    }
  };

  const handleRemoveParty = (index: number) => {
    remove(index);
    methods.trigger("consultedParties");
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
                        backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
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
                  endAdornment: inputValue && inputValue !=="" ? (
                    <InputAdornment position="end" sx={{ marginRight: "-5px" }}>
                      <IconButton
                        onClick={handleAddParty}
                        sx={{
                          padding: 0,
                          borderRadius: "50%",
                          backgroundColor: BCDesignTokens.surfaceColorBackgroundDarkBlue,
                          color: "white",
                          "&:hover": { backgroundColor: BCDesignTokens.surfaceColorBackgroundDarkBlue },
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
