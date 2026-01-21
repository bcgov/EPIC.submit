import { AppBar, Box, Divider, Grid, Typography } from "@mui/material";
import EAO_Logo from "@/assets/images/EAO_Logo.png";
import { AppConfig } from "@/utils/config";
import AppBarActions from "./AppBarActions";
import { useIsMobile } from "@/hooks/common";
import MobileNav from "./MobileNav";
import { BCDesignTokens } from "epic.theme";
import { useNavigate } from "@tanstack/react-router";
import { useAccount } from "@/store/accountStore";
import { HTTP_STATUS } from "@/utils/constants";

export default function EAOAppBar() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const account = useAccount();

  const needsAccess = account?.error?.status === HTTP_STATUS.NOT_FOUND;

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        sx={{
          borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          boxShadow: "none",
        }}
      >
        <Grid
          container
          marginY={BCDesignTokens.layoutMarginSmall}
          paddingX={isMobile ? 0 : "0.5rem"}
          justifyContent="space-between"
        >
          <Box
            display="flex"
            justifyContent="start"
            alignItems="center"
            onClick={() =>
              navigate({
                to: needsAccess ? "/logout" : `/`,
              })
            }
            sx={{
              cursor: "pointer",
            }}
          >
            <img src={EAO_Logo} height={isMobile ? 40 : 56} />
            {!isMobile && (
              <>
                <Divider orientation="vertical" flexItem sx={{ m: 1 }} />
                <Typography
                  variant="h2"
                  color="inherit"
                  component="div"
                  paddingLeft={"0.5rem"}
                  fontWeight={"bold"}
                >
                  {AppConfig.appTitle || "EPIC.submit"}
                </Typography>
              </>
            )}
          </Box>
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            paddingRight={"0.75rem"}
          >
            <AppBarActions />
          </Grid>
        </Grid>
      </AppBar>
      {isMobile && <MobileNav />}
    </>
  );
}
