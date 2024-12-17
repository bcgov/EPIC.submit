import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import NoRoles from "@/components/Shared/NoRoles";
import { PageLoader } from "@/components/Shared/PageLoader";
import { getUserByGuidQueryOptions } from "@/hooks/api/useAccounts";
import { useStaffAddUser, useStaffUserById } from "@/hooks/api/useStaffUser";
import { useIsMobile, useMounted } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { getUserRolesFromToken } from "@/utils";
import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
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
  } = useAuth();

  const { mutate: addStaffUser, isPending: isCreatingStaffUserPending } =
    useStaffAddUser();

  const queryClient = useQueryClient();
  const userData = queryClient.getQueryData(
    getUserByGuidQueryOptions({
      guid: kcUser?.profile.sub,
    }).queryKey,
  );

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isAuthenticated) {
      signinRedirect();
    } else {
      setAccount({
        isLoading: false,
        userType: USER_TYPE.STAFF,
        roles: getUserRolesFromToken(kcUser?.access_token),
      });
    }
  }, [
    kcUser?.access_token,
    isAuthenticated,
    signinRedirect,
    setAccount,
    kcUser,
  ]);

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
  }, [userData, kcUser]);

  const isLoading = isAccountLoading;

  if (isLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  if (kcUser?.profile.identity_provider !== IDIR) {
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
