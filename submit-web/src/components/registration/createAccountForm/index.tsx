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
import BarTitle from "@/components/Shared/Text/BarTitle";
import { useGetAccountProject } from "@/hooks/api/useProjects";

const createAccountSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  surname: yup.string().required("Please enter your surname."),
  position: yup.string().required("Please enter your position."),
  phone: yup.string().required("Please enter your phone number."),
  email: yup
    .string()
    .email("Invalid email")
    .required("Please enter your email."),
});

export type CreateAccountFormSchema = yup.InferType<typeof createAccountSchema>;

function CreateAccountForm() {
  const { user } = useAuth();
  const { setStep, invitation } = useCreateAccountForm();
  const { setAccount } = useAccount();

  const { data: project } = useGetAccountProject({
    accountProjectId: invitation?.project_ids[0] ?? null,
  });

  const onCreateAccountSuccess = (data: AcceptInvitationResponse) => {
    setStep(CREATE_ACCOUNT_STEPS.ADD_PROJECTS);
    setAccount({
      userId: data.user_id,
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
    if (!user?.profile.sub || !invitation) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      position: data.position,
      work_contact_number: data.phone,
      work_email_address: data.email,
      auth_guid: user?.profile.sub,
      proponent_id: invitation.account_id,
    };
    doCreateAccount(accountData);
  };

  return (
    <>
      <Banner>{project?.project?.name}</Banner>
      <GridContainer>
        <Grid item xs={12} mb={"16px"}>
          <BarTitle title="Welcome to EPIC.submit" />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Thank you for taking a few minutes to set up the{" "}
            {project?.project?.name}
            account.
            <br />
            <br />
            First of all, please create your Project Administrator Account for
            {project?.project?.name}.
            <br />
            <br />
            Project Administrators can
            <ul style={{ paddingTop: "0rem", marginTop: "0rem" }}>
              <li>Access all the submissions</li>
              <li>Create new submissions and submit submissions to the EAO</li>
              <li>Add users and manage user access</li>
            </ul>
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
                  label={`Your Position/Role at ${project?.project?.proponent_name}.`}
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700 },
                  }}
                />
                <ControlledInputMask
                  name="phone"
                  mask="(999) 999-9999"
                  label="Your Work Phone Number"
                  fullWidth
                  InputLabelProps={{
                    sx: { fontWeight: 700 },
                  }}
                />
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
