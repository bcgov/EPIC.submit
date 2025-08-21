import { PageLoader } from "@/components/Shared/PageLoader";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { HTTP_STATUS } from "@/utils/constants";
import { createFileRoute, Navigate } from "@tanstack/react-router";

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
  if (token) {
    return (
      <Navigate
        to="/proponent/registration"
        search={{
          token: token,
        }}
      />
    );
  }

  if (account.isLoading) {
    return <PageLoader />;
  }

  if (account?.error?.status === HTTP_STATUS.NOT_FOUND) {
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
    return <Navigate to={baseProponentPath} />;
  }

  return <Navigate to="/logout" />;
}
