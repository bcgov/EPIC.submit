import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useAuth } from "react-oidc-context";
import { Banner } from "@/components/registration/Banner";
import { GridContainer } from "@/components/registration/GridContainer";
import { BCDesignTokens } from "epic.theme";
import ControlledInputMask from "@/components/Shared/controlled/ControlledInputMask";
import { Save } from "@mui/icons-material";
import { CircularProgress, Grid, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { useCreateAccountForm } from "../formStore";
import { CREATE_ACCOUNT_STEPS } from "../constants";
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
import { useCallback, useEffect } from "react";

const createAccountSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  position: yup.string().required("Please enter your position."),
  phone: yup.string().required("Please enter your phone number."),
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

  const { data: projects } = useLoadProjectsByProponentId(
    invitation?.proponent_id,
  );

  const onCreateAccountSuccess = (data: AcceptInvitationResponse) => {
    setAccount({
      userId: data.user_id,
      userManagementRole: data.role,
      roles: data.role.permissions,
    });

    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.USER_ACCOUNT_DATA],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.ACCOUNT_USER],
    });
    navigateToNextStep();
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
    if (!user?.profile.sub || !invitation) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      position: data.position,
      work_contact_number: data.phone,
      work_email_address: data.email,
      auth_guid: user?.profile.sub,
      proponent_id: invitation.account_id,
      extension_number: data.extension_number,
    };
    doCreateAccount(accountData);
  };

  return (
    <>
      <Banner>{projects?.[0]?.name || ""}</Banner>
      <GridContainer>
        <Grid item xs={12} mb={"16px"}>
          <YellowBar />
          <Typography variant="h1">Welcome to EPIC.submit</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Thank you for taking a few minutes to set up the{" "}
            {projects?.[0]?.name || ""} account.
            <br />
            <br />
            {invitation?.role.role_name ===
              USER_MANAGEMENT_ROLE.PROJECT_ADMIN && (
              <>
                First of all, please create your Project Administrator Account
                for {projects?.[0]?.name ?? ""}.
                <br />
                <br />
                Project Administrators can
                <ul style={{ paddingTop: "0rem", marginTop: "0rem" }}>
                  <li>Access all the submissions</li>
                  <li>
                    Create new submissions and submit submissions to the EAO
                  </li>
                  <li>Add users and manage user access</li>
                </ul>
              </>
            )}
          </Typography>
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
                <ControlledTextField
                  name="givenName"
                  label="Your Given Name"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700, marginBottom: "0", color: "red" },
                  }}
                />
                <ControlledTextField
                  name="surname"
                  label="Your Surname"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700 },
                  }}
                />
                <ControlledTextField
                  name="position"
                  label={`Position/Role`}
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700 },
                  }}
                />
                <Grid item xs={12} container spacing={1}>
                  <Grid item xs={8.5}>
                    <ControlledInputMask
                      name="phone"
                      mask="(999) 999-9999"
                      label="Your Work Phone Number"
                      fullWidth
                      InputLabelProps={{
                        sx: { fontWeight: 700 },
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ControlledInputMask
                      name="extension_number"
                      mask="9999"
                      label="Ext."
                      fullWidth
                      sx={{ ml: 1 }}
                      InputLabelProps={{
                        sx: { fontWeight: 700 },
                      }}
                    />
                  </Grid>
                </Grid>
                <ControlledTextField
                  name="email"
                  label="Your Work Email Address"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700 },
                  }}
                />
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
              </form>
            </FormProvider>
          </Grid>
        </Grid>
      </GridContainer>
    </>
  );
}

export default CreateAccountForm;
