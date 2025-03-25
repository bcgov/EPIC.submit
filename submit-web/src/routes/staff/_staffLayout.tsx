import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import NoRoles from "@/components/Shared/NoRoles";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useAccountQuery } from "@/hooks/api/useAccounts";
import { useIsMobile } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { useAuth } from "react-oidc-context";
const IDIR = "idir";

export const Route = createFileRoute("/staff/_staffLayout")({
  component: Staff,
});

function Staff() {
  const { setAccount, roles, isLoading: isAccountLoading } = useAccount();
  const {
    user: kcUser,
    signoutRedirect,
    isAuthenticated,
    signinRedirect,
    isLoading: isAuthLoading,
  } = useAuth();

  const {
    data: accountData,
    error: getUserError,
    isPending: isUserDataPending,
  } = useAccountQuery(kcUser?.profile.sub);

  const isMobile = useIsMobile();

  const isLoading =
    isAccountLoading || isUserDataPending || isAuthLoading || isAccountLoading;

  const isIdirSignIn = kcUser?.profile.identity_provider === IDIR;

  const handleUser = useCallback(() => {
    if (!isAuthenticated) {
      signinRedirect();
      return;
    }

    if (!isIdirSignIn) {
      signoutRedirect();
      return;
    }

    if (isAccountLoading) {
      setAccount({
        ...accountData,
      });
    }
  }, [
    isAuthenticated,
    isIdirSignIn,
    isAccountLoading,
    signinRedirect,
    signoutRedirect,
    setAccount,
    kcUser,
  ]);

  useEffect(() => {
    if (!isAuthLoading) {
      handleUser();
    }
  }, [handleUser, isAuthLoading]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (getUserError) {
    return <Navigate to="/error" />;
  }

  if (!accountData || accountData?.type !== USER_TYPE.STAFF) {
    return <Navigate to="/not-found" />;
  }

  const canViewStaff = roles?.includes(EPIC_SUBMIT_ROLE.eao_view);
  if (!canViewStaff) {
    return <NoRoles />;
  }

  return (
    <div>
      <BreadcrumbNav />
      <Box flexDirection={"row"} display={"flex"}>
        {!isMobile && <EaoSideNavBar />}
        <Outlet />
      </Box>
    </div>
  );
}
