import { Box, styled } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export const SuccessBox = styled(Box)({
  border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
  borderRadius: "4px",
  display: "flex",
  alignItems: "flex-start",
  alignSelf: "stretch",
  color: BCDesignTokens.supportBorderColorSuccess,
  backgroundColor: BCDesignTokens.supportSurfaceColorSuccess,
  padding: "10px 10px 10px 12px",
  flexDirection: "column",
  gap: "4px",
});
