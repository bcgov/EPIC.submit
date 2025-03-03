import { useCreateAccountForm } from "@/components/registration/formStore";
import { TabPanel } from "@/components/registration/TabPanel";
import { PageLoader } from "@/components/Shared/PageLoader";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetInvitation } from "@/hooks/api/useInvitations";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/proponent/registration/create-account")({
  component: CreateAccount,
});

function CreateAccount() {
  const { token } = Route.useSearch<{
    token: string;
  }>();

  const { setInvitation } = useCreateAccountForm();

  const { isAuthenticated } = useAuth();

  const {
    data: invitation,
    isPending,
    isSuccess,
    isError,
  } = useGetInvitation(token, isAuthenticated);

  useEffect(() => {
    if (!isPending) {
      if (isError) {
        notify.error("registration link is invalid");
      } else if (isSuccess && invitation) {
        setInvitation(invitation);
      }
    }
  }, [isPending, isError, isSuccess, invitation]);

  if (!isAuthenticated || isError || !token) {
    return <Navigate to="/error" />;
  }

  if (isPending) {
    return <PageLoader />;
  }

  return <TabPanel />;
}
