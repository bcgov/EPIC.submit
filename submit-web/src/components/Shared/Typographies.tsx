import { styled, Typography } from "@mui/material";

export const Caption2 = styled(Typography)<{ bold?: boolean }>(({ bold }) => ({
  fontSize: 14,
  lineHeight: "16px",
  fontWeight: bold ? 700 : 400,
}));
