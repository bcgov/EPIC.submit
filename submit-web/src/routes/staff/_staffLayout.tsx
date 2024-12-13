import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import NoRoles from "@/components/Shared/NoRoles";
import { PageLoader } from "@/components/Shared/PageLoader";
import { getUserByGuidQueryOptions } from "@/hooks/api/useAccounts";
import { useStaffAddUser, useStaffUserById } from "@/hooks/api/useStaffUser";
import { useIsMobile } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { getUserRolesFromToken } from "@/utils";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { isAxiosError } from "axios";

const IDIR = "idir";

export const Route = createFileRoute("/staff/_staffLayout")({
  component: Staff,
});

function Staff() {
  const { setAccount, roles, isLoading: isAccountLoading } = useAccount();
  const { user: kcUser } = useAuth();
  const {
    user,
    signoutRedirect,
    isLoading: isAuthLoading,
    isAuthenticated,
    signinRedirect,
  } = useAuth();
  const { mutate: addStaffUser } = useStaffAddUser();
  const { data: userData, isPending: isUserPending } = useQuery(
    getUserByGuidQueryOptions({
      guid: user?.profile.sub,
    })
  );

  const {
    data: staffData,
    isPending: isStaffPending,
    error: staffError,
  } = useStaffUserById(user?.profile.sub);
  const staffIsNotRegistered =
    isAxiosError(staffError) && staffError.response?.status === 404;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      signinRedirect();
    }
    if (
      isAuthenticated &&
      !isAuthLoading &&
      !isUserPending &&
      !isStaffPending
    ) {
      if (userData && staffIsNotRegistered && kcUser) {
        const staffUser = {
          auth_guid: kcUser.profile.sub,
          first_name: kcUser.profile.given_name,
          last_name: kcUser.profile.family_name,
          work_email_address: kcUser.profile.email,
        };
        addStaffUser(staffUser);
      }
      setAccount({
        isLoading: false,
        userType: USER_TYPE.STAFF,
        roles: getUserRolesFromToken(user?.access_token),
      });
    }
  }, [
    user?.access_token,
    isAuthenticated,
    isUserPending,
    signinRedirect,
    setAccount,
    userData,
    isAuthLoading,
    isStaffPending,
    staffData,
    addStaffUser,
    staffIsNotRegistered,
    kcUser,
  ]);

  const isLoading = isAccountLoading || isAuthLoading || isUserPending;

  if (isLoading) {
    return <PageLoader />;
  }

  if (user?.profile.identity_provider !== IDIR) {
    signoutRedirect();
    return null;
  }

  if (userData?.type !== USER_TYPE.STAFF) {
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
