import { Box, styled } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const GreyBox = styled(Box)({
  border: `1px solid ${BCDesignTokens.themeGray50}`,
  borderRadius: "4px",
  display: "flex",
  alignItems: "flex-start",
  alignSelf: "stretch",
  color: BCDesignTokens.supportBorderColorSuccess,
  backgroundColor: BCDesignTokens.themeGray10,
  padding: "10px 10px 10px 12px",
  flexDirection: "column",
  gap: "4px",
});
