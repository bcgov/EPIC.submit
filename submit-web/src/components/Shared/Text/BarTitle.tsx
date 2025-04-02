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

export function BarBlueTitle({
  title,
  fullWidth,
}: {
  title: string;
  fullWidth: boolean;
}) {
  return (
    <Typography
      variant="h5"
      color={BCDesignTokens.themeBlue100}
      sx={{
        width: fullWidth ? "100%" : "auto",
        borderBottom: `2px solid ${BCDesignTokens.themeGold80}`,
      }}
    >
      {title}
    </Typography>
  );
}
