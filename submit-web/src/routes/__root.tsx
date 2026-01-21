import EAOAppBar from "@/components/Shared/Layouts/Header/EAOAppBar";
import Footer from "@/components/Shared/Layouts/Footer";
import PageNotFound from "@/components/Shared/PageNotFound";
import { Box } from "@mui/system";
import {
  CatchBoundary,
  createRootRouteWithContext,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthContextProps } from "react-oidc-context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import DrawerProvider from "@/components/Shared/Drawers/DrawerProvider";
import { QueryClient } from "@tanstack/react-query";
import { AppConfig } from "@/utils/config";
import { When } from "react-if";
import ScrollToTop from "@/components/Shared/ScrollToTop";
import { AccountStoreState } from "@/store/accountStore";

type RouterContext = {
  authentication: AuthContextProps;
  queryClient: QueryClient;
  account: AccountStoreState;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: PageNotFound,
});

function Layout() {
  const isLocal = AppConfig.environment === "local";
  const naviate = useNavigate();

  return (
    <CatchBoundary
      getResetKey={() => "reset"}
      onCatch={() => naviate({ to: "/error" })}
    >
      <ScrollToTop />
      <EAOAppBar />
      <DrawerProvider />
      <Box minHeight={"calc(100vh - 88px)"}>
        <Outlet />
      </Box>
      <Footer />
      <When condition={isLocal}>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools initialIsOpen={false} />
      </When>
    </CatchBoundary>
  );
}
