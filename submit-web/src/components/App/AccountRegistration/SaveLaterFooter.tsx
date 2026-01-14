import { Box, Button } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

export default function SaveLaterFooter() {
  return (
    <Box
      sx={{
        width: "100%",
        position: "fixed",
        bottom: 0,
        left: 0,
        zIndex: 1100,
        background: BCDesignTokens.surfaceColorBackgroundLightBlue,
        padding: "18px 76px",
      }}
    >
      <Button color="secondary">Save &amp; Continue Later</Button>
    </Box>
  );
}
