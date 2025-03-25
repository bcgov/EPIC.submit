import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import SideNavBar from "@/components/Shared/layout/SideNav/SideNavBar";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useIsMobile } from "@/hooks/common";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Box } from "@mui/material";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/proponent/_proponentLayout")({
  component: ProponentLayout,
  beforeLoad: ({ context: { authentication, account } }) => {
    if (!authentication.isLoading && !authentication?.isAuthenticated) {
      return redirect({
        to: "/login",
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
  const { isLoading } = useAccount();

  if (isLoading) {
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
