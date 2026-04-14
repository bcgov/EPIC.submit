import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/ControlledFormFields/ControlledTextField";
import { useAuth } from "react-oidc-context";
import { Banner } from "@/components/App/registration/Banner";
import { GridContainer } from "@/components/App/registration/GridContainer";
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
} from "@mui/material";
import Button from "@mui/material/Button";
import { useCreateAccountForm } from "@/components/App/registration/formStore";
import { CREATE_ACCOUNT_STEPS } from "@/components/App/registration/constants";
import {
  AcceptInvitationResponse,
  useAcceptInvitation,
} from "@/hooks/api/useInvitations";
import { useAccount } from "@/store/accountStore";
import { useLoadProjectsByProponentId } from "@/hooks/api/useProjects";
import { useNavigate } from "@tanstack/react-router";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { YellowBar } from "@/components/Shared/YellowBar";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { USER_TYPE } from "@/models/User";
import { theme } from "@/styles/theme";
import { useTermsStore } from "@/store/termsStore";
import { validatePhoneNumber } from "@/components/App/SubmissionItem/ContactInformation/utils";

const createAccountSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  companyName: yup.string().required("Please enter your company name."),
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

function CreateAccountForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { setStep, invitation } = useCreateAccountForm();
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
      setStep(CREATE_ACCOUNT_STEPS.ADD_PROJECTS);
    } else {
      navigate({ to: "/proponent/projects" });
    }
  }, [setStep, invitation, navigate]);

  useEffect(() => {
    if (userId) {
      navigateToNextStep();
    }
  }, [userId, navigateToNextStep]);

  const { data: proponentProjects } = useLoadProjectsByProponentId(
    invitation?.proponent_id,
  );

  const project = useMemo(() => {
    if (proponentProjects && proponentProjects.length > 0) {
      const filteredProjects = proponentProjects.filter(
        (pr) => pr.id && invitation?.project_ids.includes(pr.id),
      );
      return filteredProjects[0];
    }
    return null;
  }, [proponentProjects, invitation]);

  const onCreateAccountSuccess = (data: AcceptInvitationResponse) => {
    setAccount({
      userId: data.user_id,
      userManagementRole: data.roles[0],
      userManagementRoles: data.roles,
      roles: data.roles[0].permissions,
      userType: USER_TYPE.PROPONENT,
      accountId: data.account_id,
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
  });

  const { handleSubmit } = methods;

  const onSubmitHandler = async (data: CreateAccountFormSchema) => {
    if (!termsAccepted) {
      setShowTermsError(true);
      return;
    }

    if (!user?.profile.preferred_username || !invitation) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      company_name: data.companyName,
      position: data.position,
      work_contact_number: data.phone,
      work_email_address: data.email,
      auth_guid: user?.profile.preferred_username,
      proponent_id: invitation.account_id,
      extension_number: data.extension_number,
      terms_of_service_version_id: versionId,
      has_agreed_to_terms: termsAccepted,
    };
    doCreateAccount(accountData);
  };

  return (
    <>
      <Banner>{project?.name || ""}</Banner>
      <GridContainer>
        <Grid item xs={12} mb={"16px"}>
          <YellowBar />
          <Typography variant="h1">Welcome to EPIC.submit</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Please provide your information to set up your account for{" "}
            {project?.name || ""}.
          </Typography>
          {invitation?.role.role_name ===
            USER_MANAGEMENT_ROLE.PROJECT_ADMIN && (
            <Box component="div" mt={2}>
              <Typography variant="body1" component="span">
                Project Administrators can
              </Typography>
              <ul style={{ paddingTop: "0rem", marginTop: "0rem" }}>
                <li>Access all the submissions</li>
                <li>
                  Create new submissions and submit submissions to the EAO
                </li>
                <li>Add users and manage user access</li>
              </ul>
            </Box>
          )}
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
          justifyContent="center"
          alignItems="flex-start"
          marginTop="0.75rem"
          container
          mt={"24px"}
        >
          <Grid item xs={12}>
            <Typography
              variant="h5"
              color={BCDesignTokens.themeBlue100}
              sx={{
                borderBottom: `2px solid ${BCDesignTokens.themeGold80}`,
                marginBottom: BCDesignTokens.layoutMarginLarge,
              }}
            >
              Your Contact Information
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmitHandler)}>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="givenName"
                    label="Your Given Name"
                    fullWidth
                    InputLabelProps={{
                      sx: { fontWeight: 700, marginBottom: "0", color: "red" },
                    }}
                    sx={{ mb: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="surname"
                    label="Your Surname"
                    fullWidth
                    InputLabelProps={{
                      sx: { fontWeight: 700 },
                    }}
                    sx={{ mb: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="companyName"
                    label="Company Name"
                    fullWidth
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                    sx={{ mb: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="position"
                    label="Position/Role"
                    fullWidth
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                    sx={{ mb: 0 }}
                  />
                </Grid>
                <Grid item xs={12} container spacing={1}>
                  <Grid item xs={8.5}>
                    <ControlledTextField
                      name="phone"
                      mask="(000) 000-0000"
                      label="Your Work Phone Number"
                      fullWidth
                      InputLabelProps={{
                        sx: { fontWeight: 700 },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ControlledTextField
                      name="extension_number"
                      mask="0000"
                      label="Ext."
                      fullWidth
                      sx={{ ml: 1 }}
                      InputLabelProps={{
                        sx: { fontWeight: 700 },
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="email"
                    label="Your Work Email Address"
                    fullWidth
                    InputLabelProps={{ sx: { fontWeight: 700 } }}
                  />
                </Grid>
                <Grid
                  container
                  spacing={1}
                  alignItems="flex-start"
                  marginBottom={4}
                >
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
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        lineHeight: "1.4375em",
                        color: "text.primary",
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
                <Box mt={2}>
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
      </GridContainer>
    </>
  );
}

export default CreateAccountForm;
