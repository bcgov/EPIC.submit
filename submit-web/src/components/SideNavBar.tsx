import { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemButton, useTheme } from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";
import { theme } from "@/styles/theme";

export default function SideNavBar() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const location = useLocation();

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  const routes = [
    {
      routeName: "Root",
      path: "/",
    },
    {
      routeName: "About",
      path: "/about",
    },
    {
      routeName: "Plans list",
      path: "/planslist",
    },
  ];

  return (
    <div>
      <Box
        sx={{ overflow: "auto", borderRight: "1px solid #0000001A" }}
        width={240}
        height={"calc(100vh - 88px)"}
      >
        <List>
          {routes.map((route) => (
            <ListItem key={route.routeName}>
              <Link
                to={route.path}
                onClick={() => setCurrentPath(route.path)}
                style={{
                  color: theme.palette.primary.main,
                  fontWeight: currentPath === route.path ? "bold" : "normal",
                  textDecoration: "none",
                  width: "100%",
                }}
              >
                <ListItemButton
                  sx={{
                    fontWeight: "700",
                    backgroundColor:
                      currentPath === route.path
                        ? "rgba(0, 0, 0, 0.1)"
                        : "transparent",
                    borderLeft:
                      currentPath === route.path
                        ? `4px solid ${theme.palette.primary.main}`
                        : "none",
                  }}
                >
                  <span style={{ color: "inherit" }}>{route.routeName}</span>
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );
}
