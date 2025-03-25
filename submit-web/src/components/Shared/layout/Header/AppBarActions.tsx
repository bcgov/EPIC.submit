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
import { useState } from "react";
import { OidcConfig } from "@/utils/config";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { useGetUserByGuid } from "@/hooks/api/useAccounts";
import { IDENTITY_PROVIDERS, USER_TYPE } from "@/models/User";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import GroupIcon from "@mui/icons-material/Group";

type IdentityProvider =
  (typeof IDENTITY_PROVIDERS)[keyof typeof IDENTITY_PROVIDERS];

export default function AppBarActions() {
  const auth = useAuth();
  const { data: user_data, isPending: isUserDataLoading } = useGetUserByGuid({
    guid: auth.user?.profile.sub,
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

  const userName = isUserDataLoading ? (
    <CircularProgress size={20} sx={{ marginLeft: 1 }} />
  ) : user_data?.type === USER_TYPE.PROPONENT && user_data?.account_user ? (
    <span>
      Hi,{" "}
      <b>
        {user_data.account_user.first_name} {user_data.account_user.last_name}
      </b>
    </span>
  ) : user_data?.staff_user ? (
    <span>
      Hi,{" "}
      <b>
        {user_data.staff_user.first_name} {user_data.staff_user.last_name}
      </b>
    </span>
  ) : null;

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
                <MenuItem onClick={() => handleNavigate("/proponent/profile")}>
                  My Profile
                </MenuItem>
                {user_data?.type === USER_TYPE.PROPONENT && (
                  <MenuItem
                    onClick={() => handleNavigate("/proponent/edit-profile")}
                  >
                    Edit My Profile
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
              <MenuItem onClick={() => handleLogin(IDENTITY_PROVIDERS.BCSC)}>
                <ListItemIcon>
                  <RecentActorsIcon />
                </ListItemIcon>
                <ListItemText primary="BC Services Card" />
              </MenuItem>
              <MenuItem onClick={() => handleLogin(IDENTITY_PROVIDERS.BCEID)}>
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText primary="BCeID" />
              </MenuItem>
              <MenuItem onClick={() => handleLogin(IDENTITY_PROVIDERS.IDIR)}>
                <ListItemIcon>
                  <GroupIcon />
                </ListItemIcon>
                <ListItemText primary="IDIR" />
              </MenuItem>
            </MenuList>
          </Popover>
        </>
      )}
    </>
  );
}
