import { PageLoader } from "@/components/Shared/PageLoader";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { USER_TYPE } from "@/models/User";
import { HTTP_STATUS } from "@/utils/constants";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback/")({
  component: OidcCallback,
});

const ERROR_MESSAGE = "An error occurred while loading user data";

function OidcCallback() {
  const { error: getAuthError, user: kcUser } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const proponent_id = params.get("proponent_id");

  const { data: userData, error: getUserError } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  if (getAuthError) {
    return <Navigate to="/error" />;
  }

  if (getUserError) {
    if (isAxiosError(getUserError)) {
      if (
        getUserError.response?.status === HTTP_STATUS.NOT_FOUND &&
        proponent_id
      ) {
        return (
          <Navigate
            to="/proponent/registration/create-account"
            search={{
              proponent_id: proponent_id
                ? Number.parseInt(proponent_id)
                : undefined,
            }}
          />
        );
      } else {
        notify.error(getUserError.response?.data?.message || ERROR_MESSAGE);
        return <Navigate to="/error" />;
      }
    }
    notify.error(ERROR_MESSAGE);
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
