import React, { useMemo } from "react";
import { Box, Breadcrumbs } from "@mui/material";
import { Link, useRouterState } from "@tanstack/react-router";
import { theme } from "@/styles/theme";

interface RouteSegment {
  title: string;
  path?: string;
}

const BreadcrumbNav: React.FC = () => {
  const matches = useRouterState({ select: (s) => s.matches });

  const breadcrumbs = useMemo(() => {
    return matches
      .map((match) => {
        const { meta, pathname } = match;
        if (meta && meta[0]?.title && pathname) {
          return {
            title: meta[0].title,
            path: pathname,
          };
        }
        return null;
      })
      .filter(Boolean) as RouteSegment[];
  }, [matches]);

  return (
    <Box
      sx={{
        p: 1,
        paddingLeft: theme.spacing(4),
        borderBottom: "1px solid #0000001A",
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbs.map((segment: { title: string; path?: string }) => {
          const { title, path } = segment;
          return (
            <Link
              key={path}
              style={{
                color: theme.palette.primary.dark,
                textDecoration: "underline",
              }}
              to={path}
            >
              {title}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNav;
