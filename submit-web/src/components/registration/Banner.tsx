import { theme } from "@/styles/theme";
import { Box, Typography } from "@mui/material";
import React from "react";

type BannerProps = {
  children?: React.ReactNode;
};
export const Banner = ({ children }: BannerProps) => {
  return (
    <Box
      position="relative"
      bgcolor="#F0F8FF"
      zIndex={theme.zIndex.appBar - 10}
      height={76}
      display={"flex"}
      alignItems={"center"}
      px={9.5}
    >
      <Typography variant="h5" color="initial" fontWeight={600}>
        {children}
      </Typography>
    </Box>
  );
};
