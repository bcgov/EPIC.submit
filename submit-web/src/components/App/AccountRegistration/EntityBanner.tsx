import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useCreateAccountFormStore } from "./formStore";

export const EntityBanner = () => {
  const { entityName } = useCreateAccountFormStore();
  return entityName ? (
    <Box
      sx={{
        width: "auto",
        background: BCDesignTokens.surfaceColorBackgroundLightBlue,
        padding: "20px 76px",
      }}
      data-testid="entity-banner"
    >
      <Typography variant="h4" data-testid="entity-banner-label">
        {entityName}
      </Typography>
    </Box>
  ) : null;
};
