import { Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type WarningBoxProps = {
  children: React.ReactNode;
};

export default function WarningBox({ children }: WarningBoxProps) {
  return (
    <Box
      sx={{
        border: `2px solid ${BCDesignTokens.supportBorderColorWarning}`,
        backgroundColor: BCDesignTokens.supportSurfaceColorWarning,
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        p: BCDesignTokens.layoutPaddingMedium,
      }}
    >
      {children}
    </Box>
  );
}
