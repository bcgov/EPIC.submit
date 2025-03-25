import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import SideNavBar from "@/components/Shared/layout/SideNav/SideNavBar";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useIsMobile } from "@/hooks/common";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box } from "@mui/material";
import {
  createFileRoute,
  Navigate,
  Outlet,
  redirect,
} from "@tanstack/react-router";
export const Route = createFileRoute("/proponent/_proponentLayout")({
  component: ProponentLayout,
  beforeLoad: ({ context: { authentication, account } }) => {
    if (!authentication.isLoading && !authentication?.isAuthenticated) {
      return redirect({
        to: "/login",
      });
    }

    if (!account.isLoading && account.userType !== USER_TYPE.PROPONENT) {
      return redirect({
        to: "/unauthorized",
      });
    }
  },
});

function ProponentLayout() {
  const { isLoading: isAccountLoading, userId } = useAccount();

  const isMobile = useIsMobile();

  if (isAccountLoading) {
    return <PageLoader />;
  }

  if (!userId) {
    return <Navigate to={"/error"} />;
  }

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
