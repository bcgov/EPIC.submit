import { Box, LinearProgress } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function ProgressBar() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "0.75rem",
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        overflow: "hidden",
        marginRight: BCDesignTokens.layoutMarginSmall,
        border: `1px solid ${BCDesignTokens.themeBlue20}`,
      }}
    >
      <LinearProgress
        color="secondary"
        sx={{
          height: "100%",
          backgroundColor: "#FDD166",
        }}
      />
    </Box>
  );
}
