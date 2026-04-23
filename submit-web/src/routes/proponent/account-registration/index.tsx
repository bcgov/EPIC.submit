import { PageLoader } from "@/components/Shared/PageLoader";
import { Typography, Container } from "@mui/material";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useGetInvitationByToken } from "@/hooks/api/useInvitations";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
import { LandingPageComponent } from "@/components/App/LandingPageComponent";

export const Route = createFileRoute("/proponent/account-registration/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string,
    };
  },
  loader: ({ location }) => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    return {
      token: token,
    };
  },
  component: AccountRegistration,
});

function AccountRegistration() {
  const { token } = Route.useSearch();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { setInvitation, invitation } = useCreateAccountFormStore();

  const {
    data: invitationData,
    isPending,
    isSuccess,
    isError,
    error,
  } = useGetInvitationByToken(token);

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
    return <Navigate to="/proponent/account-registration/create-account" />;
  }

  return <LandingPageComponent />;
}
