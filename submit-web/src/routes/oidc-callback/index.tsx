import { PageLoader } from "@/components/Shared/PageLoader";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { HTTP_STATUS } from "@/utils/constants";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback/")({
  component: OidcCallback,
});

function OidcCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const path = params.get("path");
  const baseStaffPath = "/staff";
  const baseProponentPath = "/proponent";

  const account = useAccount();
  const {
    isAuthenticated,
    signoutSilent,
    isLoading: isAuthLoading,
  } = useAuth();

  if (account.isLoading || isAuthLoading) {
    return <PageLoader />;
  }

  if (token) {
    return (
      <Navigate
        to="/proponent/account-registration"
        search={{
          token: token,
        }}
      />
    );
  }

  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/" />;
  }

  if (account?.error?.status === HTTP_STATUS.NOT_FOUND) {
    signoutSilent();
    return <Navigate to="/need-access" />;
  }

  if (account?.error) {
    return <Navigate to="/error" />;
  }

  if (account.userType === USER_TYPE.STAFF) {
    const navPath = path?.startsWith(baseStaffPath) ? path : baseStaffPath;
    return <Navigate to={navPath} />;
  }

  if (account.userType === USER_TYPE.PROPONENT && account.accountId) {
    const navPath = path?.startsWith(baseProponentPath)
      ? path
      : baseProponentPath;
    return <Navigate to={navPath} />;
  }

  return <Navigate to="/logout" />;
}
