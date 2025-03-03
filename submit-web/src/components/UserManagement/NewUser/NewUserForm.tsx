import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { TableBox } from "../../Shared/TableBox";
import { Box, Container, Divider, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const newUser = yup.object().shape({
  email: yup.string().email().required("Please enter a valid email address."),
  applicationAccess: yup.string().required("Please select an option."),
});

type NewUserSchema = yup.InferType<typeof newUser>;

export default function NewUserForm() {
  const methods = useForm<NewUserSchema>({
    resolver: yupResolver(newUser),
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  return (
    <TableBox mainLabel={"User Management"}>
      <FormProvider {...methods}>
        <Box
          flexDirection={"column"}
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <Container
            maxWidth="sm"
            sx={{
              pt: BCDesignTokens.layoutPaddingMedium,
              pb: BCDesignTokens.layoutPaddingSmall,
              alignSelf: "flex-start",
              m: 0,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: BCDesignTokens.themeBlue100,
                fontWeight: 700,
              }}
            >
              Add New User
            </Typography>
            <Divider
              sx={{ backgroundColor: BCDesignTokens.themeGold100, height: 1 }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                mt: BCDesignTokens.layoutMarginMedium,
                mb: BCDesignTokens.layoutMarginSmall,
              }}
            >
              Enter the new user's email address associated with their BCeID
              account.
            </Typography>
            <Typography variant="subtitle2">
              The user will receive an email invitation to join your project.
            </Typography>
            <ControlledTextField
              variant="outlined"
              fullWidth
              name="email"
              sx={{ mt: BCDesignTokens.layoutPaddingMedium }}
            />
          </Container>
          <Container
            maxWidth="sm"
            sx={{
              pb: BCDesignTokens.layoutPaddingXlarge,
              alignSelf: "flex-start",
              m: 0,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: BCDesignTokens.themeBlue100,
                fontWeight: 700,
              }}
            >
              Assign Application Access
            </Typography>
            <Divider
              sx={{ backgroundColor: BCDesignTokens.themeGold100, height: 1 }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                mt: BCDesignTokens.layoutMarginMedium,
                mb: BCDesignTokens.layoutMarginSmall,
              }}
            >
              What permissions should this user have?
            </Typography>
            <ControlledRadioGroup name="applicationAccess">
              <YesNoRadioOptions error={false} />
            </ControlledRadioGroup>
          </Container>
        </Box>
      </FormProvider>
    </TableBox>
  );
}
