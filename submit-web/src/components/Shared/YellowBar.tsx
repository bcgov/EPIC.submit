import { Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const YellowBar = () => {
  return (
    <Box
      sx={{
        height: "5px",
        width: "50px",
        mb: BCDesignTokens.layoutMarginSmall,
        backgroundColor: BCDesignTokens.themeGold100,
      }}
    />
  );
};
