import { PageLoader } from "@/components/Shared/PageLoader";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { useCreateAccountFormStore } from "@/components/App/AccountRegistration/formStore";
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
  const { invitation } = useCreateAccountFormStore();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

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
  /** A 404 means the user authenticated (valid BCSC/BCeID) but has no account in
   the submit system yet. That is an expected state for fresh proponents*/
  const notInSystem = account?.error?.status === HTTP_STATUS.NOT_FOUND;

  if (account?.error && !notInSystem) {
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

  // Authenticated (valid BCSC/BCeID) but no account in the submit system yet.
  // Users who arrived via an invitation link have their invitation stored in
  // the create-account-form session store, so continue their registration.
  // Everyone else has no path into the system and is sent to /need-access.
  if (invitation) {
    return <Navigate to="/proponent/account-registration/create-account" />;
  }

  return <Navigate to="/need-access" />;
}
