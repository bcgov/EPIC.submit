import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import SideNavBar from "@/components/Shared/layout/SideNav/SideNavBar";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useIsMobile } from "@/hooks/common";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { LOGIN_REDIRECT } from "@/utils/constants";
import { Box } from "@mui/material";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/proponent/_proponentLayout")({
  component: ProponentLayout,
  beforeLoad: ({ context: { authentication, account } }) => {
    if (!authentication.isLoading && !authentication?.isAuthenticated) {
      return redirect({
        to: "/login",
        search: `?from=${LOGIN_REDIRECT.proponent}`,
      });
    }

    if (!account.isLoading) {
      if (!account.userId) {
        return redirect({
          to: "/error",
        });
      }
      if (account.userType !== USER_TYPE.PROPONENT) {
        return redirect({
          to: "/unauthorized",
        });
      }
    }
  },
});

function ProponentLayout() {
  const isMobile = useIsMobile();
  const account = useAccount();

  if (account.isLoading) {
    return <PageLoader />;
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
