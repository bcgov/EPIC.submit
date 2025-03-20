import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import SideNavBar from "@/components/Shared/layout/SideNav/SideNavBar";
import { PageLoader } from "@/components/Shared/PageLoader";
import {
  getUserByGuidQueryOptions,
  useGetUserByGuid,
} from "@/hooks/api/useAccounts";
import { useIsMobile } from "@/hooks/common";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export const Route = createFileRoute("/proponent/_proponentLayout")({
  component: ProponentLayout,
  loader: ({ context: { queryClient, authentication } }) =>
    queryClient.ensureQueryData(
      getUserByGuidQueryOptions({ guid: authentication?.user?.profile.sub }),
    ),
});

function ProponentLayout() {
  const {
    isAuthenticated,
    signinRedirect,
    isLoading: isUserAuthLoading,
    user,
  } = useAuth();
  const { data: userData, isPending: isUserAccountLoading } = useGetUserByGuid({
    guid: user?.profile.sub,
  });
  const { setAccount, isLoading: isAccountLoading } = useAccount();

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
        userType: USER_TYPE.PROPONENT,
        userManagementRole: userData?.account_user.role,
        roles: userData?.account_user.role.permissions,
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
  const isMobile = useIsMobile();

  if (isLoading || isAccountLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || userData?.type !== USER_TYPE.PROPONENT) {
    return <Navigate to={"/not-found"} />;
  }

  console.log("isAccountLoading", isAccountLoading);
  return (
    <div>
      <BreadcrumbNav />
      <Box flexDirection={"row"} display={"flex"}>
        {!isMobile && <SideNavBar />}
        <Outlet />
      </Box>
    </div>
  );
}
