import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { Box, Button, Container, Typography } from "@mui/material";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/proponent/account-registration/registration-error",
)({
  component: RegistrationErrorComponent,
});

function RegistrationErrorComponent() {
  const navigate = useNavigate();
  const { entityName, invitation } = useCreateAccountFormStore();

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <Typography variant="h2" color="error" gutterBottom>
        Registration Error
      </Typography>
      <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
        The user you are trying to register for <b>{entityName}</b> already
        exists.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, mt: 2 }}>
        Please try again with a different user.
      </Typography>
      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate({ to: "/proponent/projects", replace: true })}
        >
          Go to Projects
        </Button>
        <Button
          variant="outlined"
          color="primary"
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
    </Container>
  );
}
