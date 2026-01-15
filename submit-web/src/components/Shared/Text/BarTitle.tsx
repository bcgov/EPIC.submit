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
  tooltip,
  bold = true,
  variant = "h4",
}: {
  title: string;
  fullWidth?: boolean;
  tooltip?: React.ReactNode;
  bold?: boolean;
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  return (
    <Typography
      variant={variant}
      color={BCDesignTokens.themeBlue100}
      sx={{
        mt: BCDesignTokens.layoutMarginSmall,
        width: fullWidth ? "100%" : "auto",
        borderBottom: `2px solid ${BCDesignTokens.themeGold80}`,
        fontWeight: bold ? "bold" : "normal",
      }}
    >
      <>
        {title}
        {tooltip}
      </>
    </Typography>
  );
}
