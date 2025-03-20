import { Box, Paper, PaperProps, Stack, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type ContentBoxVariant = "primary" | "secondary";

type ContentBoxProps = {
  mainLabel: React.ReactNode;
  topLabel?: string;
  bottomLabel?: string;
  children?: React.ReactNode;
  contentBoxVariant?: ContentBoxVariant;
} & PaperProps;
export const ContentBox = ({
  children,
  mainLabel = "",
  topLabel,
  bottomLabel,
  contentBoxVariant = "primary",
  ...rest
}: ContentBoxProps) => {
  const { sx, ...otherProps } = rest;
  return (
    <Paper
      elevation={2}
      {...otherProps}
      sx={{
        boxShadow: BCDesignTokens.surfaceShadowMedium,
        maxWidth: "1448px",
        ...sx,
      }}
    >
      <Box
        sx={[
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "auto",
            padding: "0px 24px",
            height: "56px",
          },
          contentBoxVariant === "primary" && {
            backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
          },
          contentBoxVariant === "secondary" && {
            borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          },
        ]}
      >
        <Typography
          variant="h3"
          sx={[
            contentBoxVariant === "primary" && {
              fontWeight: "bold",
            },
            contentBoxVariant === "secondary" && {
              fontWeight: "400",
            },
          ]}
        >
          {mainLabel || ""}
        </Typography>
        {topLabel && bottomLabel && (
          <Stack textAlign={"right"}>
            <Typography
              variant="body1"
              sx={{
                mr: 2,
                fontWeight: "bold",
              }}
            >
              {topLabel}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mr: 2,
              }}
            >
              {bottomLabel}
            </Typography>
          </Stack>
        )}
      </Box>
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
