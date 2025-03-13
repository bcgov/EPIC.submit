import {
  Box,
  Typography,
  Button,
  Menu,
  IconButton,
  MenuItem,
  CircularProgress,
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
import { USER_TYPE } from "@/models/User";

export default function AppBarActions() {
  const auth = useAuth();
  const {
    data: user_data,
    isPending: isUserDataLoading,
  } = useGetUserByGuid({
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

  const handleNavigate = (path: string) => {
    handleClose();
    navigate({ to: path });
  };

  const userName = isUserDataLoading ? (
    <CircularProgress size={20} sx={{ marginLeft: 1 }} />
  ) : (
    <b>
      {user_data?.type === USER_TYPE.PROPONENT
        ? `${user_data?.account_user.first_name} ${user_data?.account_user.last_name}`
        : `${user_data?.staff_user.first_name} ${user_data?.staff_user.last_name}`}
    </b>
  );

  return (
    <>
      {auth.isAuthenticated ? (
        <>
          <Box id="menu-appbar" display={"flex"} onClick={handleClick}>
            <Typography variant="body2" color="primary">
              Hi, {userName}
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
            <MenuItem
              onClick={() => handleNavigate("/proponent/profile")}
            >
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
                handleClose(); // Close the menu when signing out
                auth.signoutRedirect();
              }}
            >
              Sign Out
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant="text"
          onClick={() =>
            auth.signinRedirect({
              redirect_uri: `${OidcConfig.redirect_uri}${window.location.search}`,
            })
          }
          sx={{
            color: BCDesignTokens.themeGray100,
            border: `2px solid ${theme.palette.grey[700]}`,
          }}
        >
          Sign In
        </Button>
      )}
    </>
  );
}
