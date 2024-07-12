import EAOAppBar from "@/components/EAOAppBar";
import SideNavBar from "@/components/SideNavBar";
import { Box } from "@mui/material";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <EAOAppBar />
      <Box display={"flex"}>
        <SideNavBar />
        <Box display={"flex"} flexDirection={"column"}>
          <Outlet />
        </Box>
      </Box>
      <TanStackRouterDevtools />
    </>
  ),
});