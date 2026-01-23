import { PageLoader } from "@/components/Shared/PageLoader";
import { Typography, Container } from "@mui/material";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useGetInvitation } from "@/hooks/api/useInvitations";
import { useCreateAccountForm } from "@/components/App/registration/formStore";
import { LandingPageComponent } from "@/components/App/LandingPageComponent";

export const Route = createFileRoute("/proponent/registration/")({
  component: Registration,
});

function Registration() {
  const { token } = Route.useSearch<{ token: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { setInvitation, invitation } = useCreateAccountForm();

  const {
    data: invitationData,
    isPending,
    isSuccess,
    isError,
    error,
  } = useGetInvitation(token, Boolean(token));

  useEffect(() => {
    if (!isPending) {
      if (error) {
        notify.error("Registration link is invalid");
      } else if (isSuccess && invitationData) {
        setInvitation(invitationData);
      }
    }
  }, [
    isPending,
    error,
    isSuccess,
    invitationData,
    setInvitation,
    isAuthenticated,
    isAuthLoading,
  ]);

  if (isPending || isAuthLoading) {
    return <PageLoader />;
  }

  if (isError || error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h4" color="error">
          Invalid Registration Link
        </Typography>
        <Typography variant="body1">
          The registration link is invalid or expired. Please check your email
          for a valid link.
        </Typography>
      </Container>
    );
  }

  if (!isAuthLoading && invitation && isAuthenticated) {
    return <Navigate to="/proponent/registration/create-account" />;
  }

  return <LandingPageComponent />;
}
