import { Grid, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { CustomRadioOptions } from "@/components/Shared/CustomRadioOptions";
import { When } from "react-if";
import ActionButtons from "./ActionButtons";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";

// Define Yup schema
const consultationSchema = yup.object().shape({
  staffConsultationCheck: yup
    .boolean()
    .required("You must select a consultation check option."),
  managerConfirmation: yup
    .boolean()
    .required("Manager confirmation is required."),
});

// Define form types
type ConsultationForm = {
  staffConsultationCheck: boolean;
  managerConfirmation: boolean; // Optional if role is staff
};

export default function ReviewSection() {
  const methods = useForm<ConsultationForm>({
    resolver: yupResolver(consultationSchema),
    mode: "onSubmit",
    defaultValues: {
      staffConsultationCheck: true,
      managerConfirmation: false,
    },
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const consultationCheckOptions = [
    { label: "Yes, the holder has passed the Consultation Check", value: true },
    {
      label: "No, the holder has failed the Consultation Check",
      value: false,
    },
  ];

  const managerConfirmationOptions = [
    { label: "Yes, the holder passed the Consultation Check", value: true },
    { label: "No, the holder failed the Consultation Check", value: false },
  ];

  const role = "staff"; // Replace with actual role
  const saveAndClose = () => {
    // Add save logic here
  };

  return (
    <Grid item container>
      <Grid
        item
        xs={12}
        sx={{
          background: BCDesignTokens.themeBlue10,
          p: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(saveAndClose)}>
            <Typography variant="h6" color={"#858A8C"}>
              Consultation Check
            </Typography>
            <Divider
              sx={{
                bgcolor: BCDesignTokens.themeBlue60,
                width: 1,
                my: BCDesignTokens.layoutMarginXsmall,
              }}
            />
            <Typography
              variant="body1"
              sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
            >
              Based on the above information, has the holder passed the
              Consultation Check?
            </Typography>

            <ControlledRadioGroup name="staffConsultationCheck">
              <CustomRadioOptions
                options={consultationCheckOptions}
                error={Boolean(errors["staffConsultationCheck"])}
              />
            </ControlledRadioGroup>
            <When condition={role !== "staff"}>
              <Typography
                variant="body1"
                sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
              >
                MANAGER CONFIRMATION:
              </Typography>
              <ControlledRadioGroup name="managerConfirmation">
                <CustomRadioOptions
                  options={managerConfirmationOptions}
                  error={Boolean(errors["managerConfirmation"])}
                />
              </ControlledRadioGroup>
            </When>
            <ActionButtons saveAndClose={handleSubmit(saveAndClose)} />
          </form>
        </FormProvider>
      </Grid>
    </Grid>
  );
}
