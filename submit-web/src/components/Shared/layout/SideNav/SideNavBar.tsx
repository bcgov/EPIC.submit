import { Box, List } from "@mui/material";
import { MainListItem } from "./MainListItem";
import ProjectsSubRoutes from "./ProjectsSubRoutes";

export default function SideNavBar() {
  return (
    <div style={{ height: "100%" }}>
      <Box
        sx={{
          overflow: "auto",
          borderRight: "1px solid #0000001A",
          width: 240,
          height: "calc(100vh - 88px)",
          zIndex: 0,
          position: "static",
        }}
      >
        <List>
          <MainListItem
            route={{
              name: "All Projects",
              path: "/projects",
            }}
          />
          <ProjectsSubRoutes />
          <MainListItem
            route={{
              name: "Admin",
              path: "/profile",
            }}
          />
        </List>
      </Box>
    </div>
  );
}
