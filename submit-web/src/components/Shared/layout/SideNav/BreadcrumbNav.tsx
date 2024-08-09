import React from "react";
import { Box, Breadcrumbs, Link, Typography } from "@mui/material";
import { useRouter } from "@tanstack/react-router";

// Helper function to format segment names
const formatSegmentName = (segment: string) => {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const BreadcrumbNav: React.FC = () => {
  const router = useRouter();
  const { pathname } = router.state.location;
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <Box
      sx={{
        p: 1,
        paddingLeft: 5,
        borderBottom: "1px solid #0000001A",
      }}
    >
      <Breadcrumbs aria-label="breadcrumb">
        {pathSegments.map((segment, index) => {
          const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const path = formatSegmentName(segment);
          return isLast ? (
            <Typography key={path} color="text.primary">
              {path}
            </Typography>
          ) : (
            <Link key={path} color="primary" href={url}>
              {path}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNav;
