import { Box, Divider, Paper, PaperProps, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type TableBoxProps = {
  mainLabel: React.ReactNode;
  label?: string;
  children: React.ReactNode;
  actionBox?: React.ReactNode;
} & PaperProps;
export const TableBox = ({
  children,
  mainLabel = "",
  actionBox,
  ...rest
}: TableBoxProps) => {
  return (
    <Paper
      elevation={2}
      {...rest}
      sx={{
        boxShadow: BCDesignTokens.surfaceShadowMedium,
        maxWidth: "1448px",
        border: `1px solid ${BCDesignTokens.themeGray40}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "auto",
          padding: "12px 24px",
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 400 }}>
          {mainLabel || ""}
        </Typography>
        {actionBox}
      </Box>
      <Divider />
      <Box
        sx={{
          padding: "24px 16px 16px 16px",
          alignSelf: "stretch",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};
