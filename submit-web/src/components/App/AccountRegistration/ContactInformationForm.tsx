import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useAuth } from "react-oidc-context";
import { BCDesignTokens } from "epic.theme";
import { Save } from "@mui/icons-material";
import {
  CircularProgress,
  Grid,
  Typography,
  Checkbox,
  Box,
  FormHelperText,
  Tooltip,
  Stack,
  styled,
} from "@mui/material";
import Button from "@mui/material/Button";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import {
  AcceptInvitationResponse,
  useAcceptInvitation,
} from "@/hooks/api/useInvitations";
import { useAccount } from "@/store/accountStore";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { useCallback, useEffect, useState } from "react";
import { USER_TYPE } from "@/models/User";
import { theme } from "@/styles/theme";
import { useTermsStore } from "@/store/termsStore";
import { validatePhoneNumber } from "@/components/App/SubmissionItem/ContactInformation/utils";

const createAccountSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  company: yup.string().required("Please enter your company name."),
  position: yup.string().required("Please enter your position."),
  phone: yup
    .string()
    .required("Please enter your phone number.")
    .test(
      "phone-validation",
      "Please enter a complete phone number in this format: (xxx) xxx-xxxx.",
      validatePhoneNumber,
    ),
  email: yup
    .string()
    .email("Invalid email")
    .required("Please enter your email."),
  extension_number: yup.string().optional(),
});

export type CreateAccountFormSchema = yup.InferType<typeof createAccountSchema>;

const StyledControlledTextField = styled(ControlledTextField)({
  "& .MuiInputLabel-root": {
    fontWeight: 700,
  },
  marginBottom: 0,
});

function ContactInformationForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { invitation, entityName } = useCreateAccountFormStore();
  const { setAccount, userId } = useAccount();
  const navigate = useNavigate();

  const [showTermsError, setShowTermsError] = useState(false);
  const {
    termsAccepted,
    versionId,
    setTermsAccepted,
    setVersionId,
    setShowTermsModalFlag,
  } = useTermsStore();

  const navigateToNextStep = useCallback(() => {
    if (invitation?.is_first_time) {
      navigate({ to: "/proponent/account-registration/second-admin" });
    } else {
      navigate({ to: "/proponent/projects" });
    }
  }, [invitation, navigate]);

  useEffect(() => {
    if (userId) {
      navigateToNextStep();
    }
  }, [userId, navigateToNextStep]);

  const onCreateAccountSuccess = (data: AcceptInvitationResponse) => {
    setAccount({
      userId: data.user_id,
      userManagementRole: data.roles[0],
      roles: data.roles[0].permissions,
      userType: USER_TYPE.PROPONENT,
      accountId: data.account_id,
      proponentId: invitation?.proponent_id || 0,
    });

    queryClient.refetchQueries({
      queryKey: [QUERY_KEY.USER_ACCOUNT_DATA],
    });
    queryClient.refetchQueries({
      queryKey: [QUERY_KEY.ACCOUNT_USER],
    });
  };

  const { mutate: doCreateAccount, isPending: isCreatingAccount } =
    useAcceptInvitation({
      token: invitation?.token,
      onSuccess: onCreateAccountSuccess,
    });

  const methods = useForm({
    resolver: yupResolver(createAccountSchema),
    mode: "onSubmit",
    defaultValues: {
      company: entityName,
    },
  });

  const { handleSubmit } = methods;

  const onSubmitHandler = async (data: CreateAccountFormSchema) => {
    if (!termsAccepted) {
      setShowTermsError(true);
      return;
    }

    if (!user?.profile.sub || !invitation) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      position: data.position,
      work_contact_number: data.phone,
      work_email_address: data.email,
      auth_guid: user?.profile.sub,
      proponent_id: invitation.proponent_id,
      extension_number: data.extension_number,
      company_name: data.company,
      terms_of_service_version_id: versionId,
      has_agreed_to_terms: termsAccepted,
    };
    doCreateAccount(accountData);
  };

  return (
    <>
      <Grid
        item
        xs={12}
        md={4}
        pb={8}
        justifyContent="center"
        alignItems="flex-start"
        container
      >
        <Grid item xs={12}>
          <Typography
            variant="h5"
            color={BCDesignTokens.themeBlue100}
            sx={{
              borderBottom: `1px solid ${BCDesignTokens.themeGold80}`,
              marginBottom: BCDesignTokens.layoutMarginLarge,
            }}
          >
            Your Contact Information
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmitHandler)}>
              <StyledControlledTextField
                name="givenName"
                label="Your Given Name"
                fullWidth
              />
              <StyledControlledTextField
                name="surname"
                label="Your Surname"
                fullWidth
              />
              <StyledControlledTextField
                name="company"
                label="Your Company Name"
                fullWidth
              />
              <StyledControlledTextField
                name="position"
                label={`Your Position/Role at ${entityName}`}
                fullWidth
                InputLabelProps={{ sx: { fontWeight: 700 } }}
              />
              <Stack direction="row" spacing={1} sx={{ mb: 0 }}>
                <StyledControlledTextField
                  name="phone"
                  mask="(000) 000-0000"
                  label="Your Work Phone Number"
                  fullWidth
                  sx={{ flex: 3 }}
                />
                <StyledControlledTextField
                  name="extension_number"
                  mask="0000"
                  label="Ext."
                  fullWidth
                  sx={{ flex: 1 }}
                />
              </Stack>
              <StyledControlledTextField
                name="email"
                label="Your Work Email Address"
                fullWidth
              />
              <Grid container alignItems="center" marginBottom={4}>
                <Grid item>
                  <Tooltip
                    title={
                      termsAccepted
                        ? "You have already agreed to the Terms and Conditions"
                        : ""
                    }
                    componentsProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 200,
                          whiteSpace: "normal",
                        },
                      },
                    }}
                  >
                    <span>
                      <Checkbox
                        checked={termsAccepted}
                        disabled={termsAccepted}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            e.preventDefault();
                            setShowTermsModalFlag(true);
                          } else {
                            setTermsAccepted(false);
                            setVersionId(null);
                          }
                        }}
                        name="terms"
                        sx={{ p: 0, mr: 1 }}
                      />
                    </span>
                  </Tooltip>
                </Grid>
                <Grid item xs>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      display: "inline",
                    }}
                  >
                    I agree to the{" "}
                    <Box
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTermsModalFlag(true);
                      }}
                      sx={{
                        textDecoration: "underline",
                        cursor: "pointer",
                        color: theme.palette.primary.main,
                        fontWeight: 700,
                        ml: "2px",
                      }}
                    >
                      Terms and Conditions
                    </Box>
                  </Typography>
                </Grid>
              </Grid>
              {showTermsError && (
                <FormHelperText error>
                  To continue, please read the Terms and Conditions. The
                  agreement button will unlock once you scroll to the end.
                </FormHelperText>
              )}
              <Box my={2}>
                <Button
                  type="submit"
                  color="primary"
                  startIcon={
                    isCreatingAccount ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: BCDesignTokens.iconsColorPrimaryInvert,
                        }}
                      />
                    ) : (
                      <Save />
                    )
                  }
                  sx={{
                    height: "43px",
                    width: "91px",
                  }}
                >
                  Save
                </Button>
              </Box>
            </form>
          </FormProvider>
        </Grid>
      </Grid>
    </>
  );
}

export default ContactInformationForm;
