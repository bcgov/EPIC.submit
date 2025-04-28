import { Box, BoxProps } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type WarningBoxProps = {
  children: React.ReactNode;
} & BoxProps;

export default function WarningBox({
  children,
  sx,
  ...otherProps
}: WarningBoxProps) {
  return (
    <Box
      sx={{
        border: `2px solid ${BCDesignTokens.supportBorderColorWarning}`,
        backgroundColor: BCDesignTokens.supportSurfaceColorWarning,
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        p: BCDesignTokens.layoutPaddingMedium,
        ...sx,
      }}
      {...otherProps}
    >
      {children}
    </Box>
  );
}
