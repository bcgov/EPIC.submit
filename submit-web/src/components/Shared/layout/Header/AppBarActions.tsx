import {
  Box,
  Typography,
  Button,
  Menu,
  IconButton,
  MenuItem,
  CircularProgress,
  Popover,
  MenuList,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useAuth } from "react-oidc-context";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { theme } from "@/styles/theme";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useMemo, useState } from "react";
import { OidcConfig } from "@/utils/config";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { IDENTITY_PROVIDERS, USER_TYPE } from "@/models/User";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

type IdentityProvider =
  (typeof IDENTITY_PROVIDERS)[keyof typeof IDENTITY_PROVIDERS];

export default function AppBarActions() {
  const auth = useAuth();
  const { data: user_data, isPending: isUserDataLoading } = useGetUserByGuid({
    guid: auth.user?.profile?.sub,
  });

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const isProponent = user_data?.type === USER_TYPE.PROPONENT;

  const handleLogin = (idp: IdentityProvider) => {
    setAnchorEl(null);
    auth.signinRedirect({
      redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
      extraQueryParams: { kc_idp_hint: idp },
    });
  };

  const handleNavigate = (path: string) => {
    setAnchorEl(null);
    navigate({ to: path });
  };
  const userName = useMemo(() => {
    if (isUserDataLoading) {
      return <CircularProgress size={20} sx={{ marginLeft: 1 }} />;
    }

    const getUserGreeting = (firstName?: string, lastName?: string) =>
      firstName && lastName ? (
        <span>
          Hi,{" "}
          <b>
            {firstName} {lastName}
          </b>
        </span>
      ) : null;

    if (isProponent && user_data?.account_user) {
      return getUserGreeting(
        user_data.account_user.first_name,
        user_data.account_user.last_name,
      );
    }

    if (user_data?.staff_user) {
      return getUserGreeting(
        user_data.staff_user.first_name,
        user_data.staff_user.last_name,
      );
    }

    return null;
  }, [user_data, isUserDataLoading, isProponent]);

  return (
    <>
      {auth.isAuthenticated ? (
        <>
          {userName && (
            <>
              <Box id="menu-appbar" display={"flex"} onClick={handleClick}>
                <Typography variant="body2" color="primary">
                  {userName}
                </Typography>
                <IconButton size="small" sx={{ m: 0, p: 0 }}>
                  <KeyboardArrowDownIcon
                    fontSize="small"
                    htmlColor={theme.palette.grey[900]}
                  />
                </IconButton>
              </Box>
              <AccountCircleIcon
                fontSize="large"
                htmlColor={theme.palette.grey[900]}
                sx={{ marginLeft: "0.25rem" }}
              />
              <Menu
                id="menu-appbar"
                aria-labelledby="menu-appbar"
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                {isProponent && (
                  <MenuItem
                    onClick={() =>
                      handleNavigate("/proponent/user-management/edit-profile")
                    }
                  >
                    My Profile
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    handleNavigate("/logout");
                  }}
                >
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          )}
        </>
      ) : (
        <>
          <Button
            variant="text"
            onClick={handleClick}
            sx={{
              color: BCDesignTokens.themeGray100,
              border: `2px solid ${theme.palette.grey[700]}`,
              visibility: open ? "hidden" : "visible",
            }}
          >
            Login
          </Button>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuList>
              <MenuItem
                id="bcsc-login"
                onClick={() => handleLogin(IDENTITY_PROVIDERS.BCSC)}
              >
                <ListItemIcon>
                  <RecentActorsIcon />
                </ListItemIcon>
                <ListItemText primary="BC Services Card" />
              </MenuItem>
              <MenuItem
                id="bceid-login"
                onClick={() => handleLogin(IDENTITY_PROVIDERS.BCEID)}
              >
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText primary="BCeID" />
              </MenuItem>
              {/*
              This MenuItem is currently commented out pending discussion about whether it should be included on the Registration or Landing page. 
              We need to determine where the IDIR login option should appear based on the flow and user experience.
              <MenuItem onClick={() => handleLogin(IDENTITY_PROVIDERS.IDIR)}>
                <ListItemIcon>
                  <GroupIcon />
                </ListItemIcon>
                <ListItemText primary="IDIR" />
              </MenuItem>*/}
            </MenuList>
          </Popover>
        </>
      )}
    </>
  );
}
