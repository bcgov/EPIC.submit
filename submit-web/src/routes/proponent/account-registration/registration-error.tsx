import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/account-registration/registration-error",
)({
  component: RegistrationErrorComponent,
  head: () => ({ meta: [{ title: "Registration Error" }] }),
});

function RegistrationErrorComponent() {
  const navigate = useNavigate();
  const { entityName, invitation } = useCreateAccountFormStore();

  return (
    <Container id="RegistrationError">
      <Paper
        elevation={3}
        sx={{
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4">Registration Error</Typography>
          <Stack spacing={2} sx={{ mx: 4 }}>
            <Typography variant="body1">
              The credentials used to register for <b>{entityName}</b> are
              already attached to another EPIC.submit account. You cannot use
              the same credentials for more than one Regulated Party account.
            </Typography>
            <Typography variant="body1">
              You can use a different Business BCeID for each account, or use
              a Business BCeID for one account and your BC Services Card for
              the other account.
            </Typography>
            <Typography variant="body1">
              Please log out and log in again using different credentials.
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Button
              sx={{ width: "fit-content" }}
              onClick={() =>
                navigate({ to: "/proponent/projects", replace: true })
              }
            >
              Go to Projects
            </Button>
            <Button
              sx={{ width: "fit-content" }}
              color="secondary"
              onClick={() =>
                navigate({
                  to: "/logout",
                  search: {
                    redirect: `/proponent/account-registration?token=${invitation?.token}`,
                  },
                  replace: true,
                })
              }
            >
              Logout & Try Again
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
