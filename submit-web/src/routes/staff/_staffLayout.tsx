import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import NoRoles from "@/components/Shared/NoRoles";
import { PageLoader } from "@/components/Shared/PageLoader";
import {
  getUserByGuidQueryOptions,
  useGetUserByGuid,
} from "@/hooks/api/useAccounts";
import { useStaffAddUser } from "@/hooks/api/useStaffUser";
import { useIsMobile } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { getUserRolesFromToken } from "@/utils";
import { Box } from "@mui/material";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { set } from "lodash";
import { useEffect } from "react";
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

  const { mutate: addStaffUser, isPending: isCreatingStaffUserPending } =
    useStaffAddUser();

  const {
    data: userData,
    error: getUserError,
    isPending: isUserDataPending,
  } = useGetUserByGuid({
    guid: kcUser?.profile.sub,
  });

  const isMobile = useIsMobile();

  const isLoading =
    isAccountLoading || isUserDataPending || isAuthLoading || isAccountLoading;

  const isIdirSignIn = kcUser?.profile.identity_provider === IDIR;

  const handleUser = () => {
    if (!isAuthenticated) {
      signinRedirect();
    }

    if (!isIdirSignIn) {
      signoutRedirect();
    }

    if (isAccountLoading) {
      setAccount({
        isLoading: false,
        userType: USER_TYPE.STAFF,
        roles: getUserRolesFromToken(kcUser?.access_token),
      });
    }
  };
  useEffect(() => {
    if (!isAuthLoading) {
      handleUser();
    }
  }, [handleUser, isAuthLoading]);

  useEffect(() => {
    if (userData && kcUser && !isCreatingStaffUserPending) {
      if (!userData.staff_user) {
        const staffUser = {
          auth_guid: kcUser.profile.sub,
          first_name: kcUser.profile.given_name,
          last_name: kcUser.profile.family_name,
          work_email_address: kcUser.profile.email || "",
        };
        addStaffUser(staffUser);
      }
    }
  }, [userData, kcUser, addStaffUser, isCreatingStaffUserPending]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (getUserError) {
    return <Navigate to="/error" />;
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
