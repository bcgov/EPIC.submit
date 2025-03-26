import { PageLoader } from "@/components/Shared/PageLoader";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/oidc-callback/")({
  component: OidcCallback,
});

function OidcCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

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

  if (!account.userId) {
    return <Navigate to="/error" />;
  }

  if (account.userType === USER_TYPE.STAFF) {
    return <Navigate to="/staff/projects" />;
  }

  if (account.userType === USER_TYPE.PROPONENT && account.accountId) {
    return <Navigate to="/proponent/projects" />;
  }

  return <PageLoader />;
}
