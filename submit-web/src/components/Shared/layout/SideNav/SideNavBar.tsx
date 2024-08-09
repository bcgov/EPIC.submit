import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link } from "@tanstack/react-router";
import { theme } from "@/styles/theme";
import { useAuth } from "react-oidc-context";
import { AuthenticatedRoutes, Routes } from "./SideNavElements";
import { alpha } from "@mui/system";
import BreadcrumbNav from "./BreadcrumbNav";

export default function SideNavBar() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  let routeMenuItems = Routes;

  if (isAuthenticated) {
    routeMenuItems = routeMenuItems.concat(AuthenticatedRoutes);
  }

  return (
    <div>
      <BreadcrumbNav />
      <Box
        sx={{ overflow: "auto", borderRight: "1px solid #0000001A" }}
        width={240}
        height={"calc(100vh - 88px)"}
      >
        <List>
          {routeMenuItems.map((route) => (
            <>
              <ListItem key={route.name}>
                <Link
                  to={route.path}
                  onClick={() => setCurrentPath(route.path)}
                  style={{
                    color: theme.palette.primary.light,
                    fontWeight: "bold",
                    textDecoration: "none",
                    width: "100%",
                  }}
                >
                  <ListItemButton
                    sx={{
                      pl: "2rem",
                      backgroundColor:
                        currentPath === route.path
                          ? alpha(theme.palette.secondary.main, 0.1)
                          : alpha(theme.palette.primary.light, 0.1),
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                    }}
                  >
                    <span style={{ color: "inherit" }}>{route.name}</span>
                  </ListItemButton>
                </Link>
              </ListItem>
              {route.routes && route.routes?.length > 0 && (
                <List disablePadding key={`list-${route.name}`}>
                  {route.routes?.map((subRoute) => (
                    <ListItem
                      key={`sub-list-${subRoute?.name}`}
                      sx={{ margin: 0, padding: 0 }}
                    >
                      <Link
                        to={subRoute.path}
                        onClick={() => setCurrentPath(subRoute.path)}
                        style={{
                          textDecoration: "none",
                          margin: 0,
                          padding: 0,
                          color: "inherit",
                        }}
                        activeProps={{
                          style: {
                            color: theme.palette.primary.main,
                            fontWeight:
                              currentPath === subRoute.path ? "bold" : "normal",
                            width: "100%",
                          },
                        }}
                      >
                        <ListItemButton
                          key={`sub-list-button-${subRoute?.name}`}
                          sx={{
                            marginLeft: "40px",
                            borderLeft:
                              currentPath === subRoute.path
                                ? `4px solid ${theme.palette.primary.main}`
                                : `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <ListItemText key={`sub-list-text-${subRoute?.name}`}>
                            <span style={{ color: "inherit" }}>
                              {subRoute.name}
                            </span>
                          </ListItemText>
                        </ListItemButton>
                      </Link>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          ))}
        </List>
      </Box>
    </div>
  );
}
