import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import SideNavBar from "@/components/Shared/layout/SideNav/SideNavBar";
import NoRoles from "@/components/Shared/NoRoles";
import { PageLoader } from "@/components/Shared/PageLoader";
import { getUserByGuidQueryOptions } from "@/hooks/api/useAccounts";
import { useIsMobile } from "@/hooks/common";
import { USER_TYPE } from "@/models/User";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

const IDIR = "idir";

export const Route = createFileRoute("/staff/_staffLayout")({
  component: Proponent,
});

function Proponent() {
  const { user, signoutRedirect, isLoading: isAuthLoading } = useAuth();

  const { data: userData, isPending: isUserPending } = useQuery(
    getUserByGuidQueryOptions({
      guid: user?.profile.sub,
    }),
  );
  const isMobile = useIsMobile();

  if (isUserPending || isAuthLoading) {
    return <PageLoader />;
  }

  if (user?.profile.identity_provider !== IDIR) {
    signoutRedirect();
    return null;
  }

  if (userData?.type !== USER_TYPE.STAFF) {
    return <Navigate to="/not-found" />;
  }

  // TODO: Uncomment this block when roles are implemented
  // const noRoles = !user?.profile.roles;
  // if (noRoles) {
  //   return <NoRoles />;
  // }

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
