import { PageLoader } from "@/components/Shared/PageLoader";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { USER_TYPE } from "@/models/User";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback/")({
  component: OidcCallback,
});

function OidcCallback() {
  const { error: getAuthError, user: kcUser } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const { data: userData, error: getUserError } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  if (getAuthError) {
    return <Navigate to="/error" />;
  }

  if (token) {
    return (
      <Navigate
        to="/proponent/registration/create-account"
        search={{
          token: token,
        }}
      />
    );
  }

  if (getUserError) {
    return <Navigate to="/error" />;
  }

  if (userData?.type === USER_TYPE.STAFF) {
    return <Navigate to="/staff/projects" />;
  }

  if (
    userData?.type === USER_TYPE.PROPONENT &&
    userData?.account_user?.account_id
  ) {
    return <Navigate to="/proponent/projects" />;
  }

  return <PageLoader />;
}
