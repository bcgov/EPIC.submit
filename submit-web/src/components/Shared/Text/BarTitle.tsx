import { Box, Typography } from "@mui/material";
import { YellowBar } from "../YellowBar";
import { BCDesignTokens } from "epic.theme";

export default function BarTitle({ title }: { title: string }) {
  return (
    <Box sx={{ mt: BCDesignTokens.layoutMarginMedium }}>
      <YellowBar />
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
}
