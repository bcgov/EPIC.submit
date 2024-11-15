import {
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { When } from "react-if";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { ConsultationRecordForm } from "../constants";
import { useState } from "react";

interface FormFieldSectionProps {
  formData: ConsultationRecordForm; // Replace FormValues with your actual form schema interface
}

export default function FormFieldSection({ formData }: FormFieldSectionProps) {
  const [isHidden, setIsHidden] = useState(false);

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
            Consultation Records Information
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
                <li>Ho’rem</li>
                <li>Nustuk</li>
                <li>Langkuem</li>
                <li>Miskuuck</li>
                <When condition={formData?.consultedParties?.length > 0}>
                  {formData?.consultedParties?.map((field) => (
                    <li>{field.consultedParty}</li>
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
              of this plan?
            </Typography>
            <ControlledRadioGroup name="allPartiesConsulted">
              <YesNoRadioOptions disabled error={false} />
            </ControlledRadioGroup>
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Was the plan provided to all parties listed above for review and
              comment during plan development?
            </Typography>
            <YesNoRadioOptions disabled error={false} />
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              Have written explanations been provided to each party listed above
              on how comments were fully and impartially considered and
              addressed in the plan?
            </Typography>
            <YesNoRadioOptions disabled error={false} />
          </Grid>
          <Grid item xs={12} sx={{ mb: BCDesignTokens.layoutMarginMedium }}>
            <Typography variant="body1">
              For comments not addressed in this plan, have written explanations
              been provided to the commenters as to why the comments were not
              addressed?
            </Typography>
            <YesNoRadioOptions disabled error={false} />
          </Grid>
        </When>
      </Grid>
    </>
  );
}
