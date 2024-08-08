import { useCreateAccount } from "@/hooks/useAccounts";
import { Save } from "@mui/icons-material";
import { Box, Divider, Grid, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { theme } from "@/styles/theme";
import { useAuth } from "react-oidc-context";
import { YellowBar } from "@/components/Shared/YellowBar";

const queryParamSchema = yup.object().shape({
  proponent_id: yup.number(),
});

type QueryParamsSchema = yup.InferType<typeof queryParamSchema>;

export const Route = createFileRoute(
  "/_authenticated/registration/create-account",
)({
  component: CreateAccount,
});

const createAccountSchema = yup.object().shape({
  givenName: yup.string().required("Name is required"),
  surname: yup.string().required("Surname is required"),
  position: yup.string().required("Position is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
});

type CreateAccountForm = yup.InferType<typeof createAccountSchema>;

function CreateAccount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { proponent_id } = Route.useSearch<QueryParamsSchema>();

  const { mutate: doCreateAccount, isPending: isCreateAccountPending } =
    useCreateAccount(
      () => navigate({ to: "/profile" }),
      () => {
        return;
      },
    );

  const methods = useForm({
    resolver: yupResolver(createAccountSchema),
    mode: "onBlur",
  });

  const { handleSubmit } = methods;

  const onSubmitHandler = async (data: CreateAccountForm) => {
    if (!user?.profile.sub || !proponent_id) return;
    const accountData = {
      first_name: data.givenName,
      last_name: data.surname,
      position: data.position,
      work_contact_number: data.phone,
      work_email_address: data.email,
      auth_guid: user?.profile.sub,
      proponent_id: String(proponent_id),
    };
    doCreateAccount(accountData);
  };

  return (
    <>
      <Box
        position="relative"
        bgcolor="#F0F8FF"
        zIndex={theme.zIndex.appBar - 10}
        height={76}
        display={"flex"}
        alignItems={"center"}
        px={9.5}
      >
        <Typography variant="h3" color="initial" fontWeight={600}>
          CGI Mines Inc.
        </Typography>
      </Box>

      <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        px={9.5}
        py={7}
        height={"calc(100vh - 242px)"}
        overflow={"auto"}
        spacing={0}
      >
        <Grid item xs={12} mb={"5px"}>
          <YellowBar />
        </Grid>
        <Grid item xs={12} mb={"16px"}>
          <Typography variant="h4" fontWeight={600}>
            First, create your account.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Welcome to EPIC.submit and thank you for taking a few minutes to set
            up the BC Hydro account. First of all, please create your Account as
            an Adminstrator of EPIC.submit for CGI Mines Inc.
            <br />
            <br />
            Account Administrators have access to all the projects associated
            with your account in EPIC.submit and can manage user access, such as
            assign users to be Project Account Administrators, and assigning
            users who can upload or submit documents on behalf of CGI Mines Inc.{" "}
          </Typography>
        </Grid>

        <Grid
          item
          xs={3}
          justifyContent="center"
          alignItems="flex-start"
          marginTop="0.75rem"
          container
          mt={"24px"}
        >
          <Grid item xs={12}>
            <Typography variant="h6" color="#858A8C" fontWeight={400}>
              Your Contact Information
            </Typography>
            <Divider sx={{ marginTop: "1rem", marginBottom: "1.25rem" }} />
          </Grid>
          <Grid item xs={12}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmitHandler)}>
                <ControlledTextField
                  name="givenName"
                  label="Your Given Name"
                  fullWidth
                  InputLabelProps={{
                    sx: { marginBottom: "0", color: "red", fontWeight: "bold" },
                  }}
                />
                <ControlledTextField
                  name="surname"
                  label="Your Surname"
                  fullWidth
                />
                <ControlledTextField
                  name="position"
                  label="Your Position/Role at CGI Mines Inc."
                  fullWidth
                />
                <ControlledTextField
                  name="phone"
                  label="Your Work Phone Number"
                  fullWidth
                />
                <ControlledTextField
                  name="email"
                  label="Your Work Email Address"
                  fullWidth
                />
                <Button
                  type="submit"
                  color="primary"
                  startIcon={<Save />}
                  disabled={isCreateAccountPending}
                >
                  Save
                </Button>
              </form>
            </FormProvider>
          </Grid>
        </Grid>
      </Grid>
      <Box
        justifyContent="center"
        alignItems="flex-start"
        position="absolute"
        bgcolor="#F0F8FF"
        width="100%"
        bottom="0"
      >
        <Button color="secondary" sx={{ mx: 9.5, my: 2.25 }}>
          Save & Continue Later
        </Button>
      </Box>
    </>
  );
}
