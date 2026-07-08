import { PageLoader } from "@/components/Shared/PageLoader";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
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
    signoutRedirect,
    isLoading: isAuthLoading,
  } = useAuth();

  const needsSignout = account?.error?.status === 404;

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

  if (needsSignout) {
    signoutRedirect({
      post_logout_redirect_uri: `${window.location.origin}/need-access`,
    });
    return <PageLoader />;
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
