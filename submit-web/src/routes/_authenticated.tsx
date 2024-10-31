import { PageLoader } from "@/components/Shared/PageLoader";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { useAccount } from "@/store/accountStore";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/_authenticated")({
  component: Auth,
});

function Auth() {
  const {
    isAuthenticated,
    signinRedirect,
    isLoading: isUserAuthLoading,
    user,
  } = useAuth();
  const { data: userData, isPending: isUserAccountLoading } = useGetUserByGuid({
    guid: user?.profile.sub,
  });
  const { setAccount } = useAccount();

  const isLoading = isUserAuthLoading || isUserAccountLoading;

  useEffect(() => {
    if (!isAuthenticated && !isUserAuthLoading) {
      signinRedirect();
    }
    if (isAuthenticated && !isLoading) {
      setAccount({
        isLoading: false,
        proponentId: userData?.account_user.account.proponent_id,
        accountId: userData?.account_user.account.id,
      });
    }
  }, [
    isAuthenticated,
    isUserAuthLoading,
    signinRedirect,
    setAccount,
    userData,
    isLoading,
  ]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return <Outlet />;
}
