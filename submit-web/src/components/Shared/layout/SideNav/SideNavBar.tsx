import { Box, List } from "@mui/material";
import EntityRoutes from "./EntityRoutes";
import EAORoutes from "./EAORoutes";
import { Else, If, Then } from "react-if";

export default function SideNavBar() {
  // TODO: Replace this with actual user role check
  const isEntityUser = true; // Example: replace with a real role check

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
          <If condition={isEntityUser}>
            <Then>
              <EntityRoutes />
            </Then>
            <Else>
              <EAORoutes />
            </Else>
          </If>
        </List>
      </Box>
    </div>
  );
}
