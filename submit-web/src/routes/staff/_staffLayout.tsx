import BreadcrumbNav from "@/components/Shared/layout/SideNav/BreadcrumbNav";
import EaoSideNavBar from "@/components/Shared/layout/SideNav/EaoSideNavBar";
import { PageLoader } from "@/components/Shared/PageLoader";
import { useIsMobile } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { LOGIN_REDIRECT } from "@/utils/constants";
import { Box } from "@mui/material";
import {
  CatchBoundary,
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

const IDIR = "idir";

export const Route = createFileRoute("/staff/_staffLayout")({
  component: Staff,
  beforeLoad: ({ context: { account, authentication } }) => {
    if (!authentication.isLoading) {
      if (!authentication?.isAuthenticated) {
        return redirect({
          to: "/login",
          search: `?from=${LOGIN_REDIRECT.staff}`,
        });
      }

      if (authentication?.user?.profile.identity_provider !== IDIR) {
        return redirect({
          to: "/logout",
        });
      }
    }
    if (!account.isLoading) {
      if (account?.userType !== USER_TYPE.STAFF) {
        return redirect({
          to: "/unauthorized",
        });
      }
      if (!account?.roles?.includes(EPIC_SUBMIT_ROLE.eao_view)) {
        return redirect({
          to: "/staff/no-roles",
        });
      }
    }
  },
});

function Staff() {
  const isMobile = useIsMobile();
  const { isLoading } = useAccount();
  const navigate = useNavigate();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <CatchBoundary
      getResetKey={() => "reset"}
      onCatch={() => navigate({ to: "/error" })}
    >
      <div>
        <BreadcrumbNav />
        <Box flexDirection={"row"} display={"flex"}>
          {!isMobile && <EaoSideNavBar />}
          <Outlet />
        </Box>
      </div>
    </CatchBoundary>
  );
}
