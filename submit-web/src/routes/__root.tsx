import EAOAppBar from "@/components/Shared/layout/Header/EAOAppBar";
import Footer from "@/components/Shared/layout/Footer";
import PageNotFound from "@/components/Shared/PageNotFound";
import { Box } from "@mui/system";
import {
  CatchBoundary,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthContextProps } from "react-oidc-context";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import DrawerProvider from "@/components/Shared/Drawers/DrawerProvider";
import { QueryClient } from "@tanstack/react-query";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { AppConfig } from "@/utils/config";
import { When } from "react-if";
import ScrollToTop from "@/components/ScrollToTop";

type RouterContext = {
  authentication: AuthContextProps;
  queryClient: QueryClient;
  account: any;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Layout,
  notFoundComponent: PageNotFound,
});

function Layout() {
  const isLocal = AppConfig.environment === "local";

  return (
    <CatchBoundary
      getResetKey={() => "reset"}
      onCatch={(error) => notify.error(error.message)}
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
