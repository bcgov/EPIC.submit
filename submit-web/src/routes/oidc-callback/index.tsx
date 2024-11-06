import { PageLoader } from "@/components/Shared/PageLoader";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { USER_TYPE } from "@/models/User";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/oidc-callback/")({
  component: OidcCallback,
  // loader: ({ context: { authentication, queryClient } }) => {
  //   return queryClient.ensureQueryData(
  //     getUserByGuidQueryOptions({ guid: authentication?.user?.profile.sub }),
  //   );
  // },
  // errorComponent: () => <Navigate to="/error" />,
  // pendingComponent: () => <PageLoader />,
});

function OidcCallback() {
  const { error: getAuthError, user: kcUser } = useAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const params = new URLSearchParams(window.location.search);
  console.log(window.location.search);
  const proponent_id = params.get("proponent_id");

  useEffect(() => {
    if (kcUser) {
      setIsAuthLoading(false);
    }
  }, [kcUser, setIsAuthLoading]);

  const { data: userData, isLoading: isUserDataLoading } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  if (getAuthError) {
    return <Navigate to="/error" />;
  }

  if (userData?.type === USER_TYPE.STAFF) {
    return <Navigate to="/staff/projects" />;
  }

  if (userData?.account_user?.account_id) {
    return <Navigate to="/proponent/projects" />;
  }

  if (!isAuthLoading && !isUserDataLoading) {
    console.log("redirecting with proponent id", proponent_id);
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
  }

  return <PageLoader />;
}
