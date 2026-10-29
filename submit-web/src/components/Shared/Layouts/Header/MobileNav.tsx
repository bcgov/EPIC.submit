import { Box, Typography } from "@mui/material";
import { AppConfig } from "@/utils/config";
import MenuIcon from "@mui/icons-material/Menu";
import { theme } from "@/styles/theme";
import { openDrawer } from "@/components/Shared/Drawers/DrawerStore";
import SideNavBar from "@/components/Shared/Layouts/SideNav/SideNavBar";

export default function MobileNav() {
  return (
    <Box
      sx={{
        display: "flex",
        p: 1,
        borderBottom: "1px solid #0000001A",
        justifyContent: "space-between"
      }}>
      <Typography
        variant="h5"
        color="info"
        component="div"
        sx={{
          paddingLeft: "0.5rem",
          fontWeight: "bold"
        }}>
        {AppConfig.appTitle || "EPIC.submit"}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mr: theme.spacing(1)
        }}>
        <Typography variant="body1" color="info" sx={{
          mr: 1
        }}>
          Menu
        </Typography>
        <MenuIcon
          fontSize="small"
          htmlColor={theme.palette.text.primary}
          sx={{ m: 0, p: 0, alignSelf: "center" }}
          onClick={() => openDrawer(<SideNavBar />, "left")}
        />
      </Box>
    </Box>
  );
}
