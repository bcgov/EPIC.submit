import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

/**
 * Pre-launch upgrade / downtime notice banner shown on the public welcome page.
 *
 * This is a warning-style, non-dismissible banner announcing the upcoming
 * upgrade and maintenance window. Its content is fixed in code; visibility is
 * controlled at deploy time via the `VITE_SHOW_UPGRADE_BANNER` runtime config
 * flag (see AppConfig.showUpgradeBanner). It is removed when the post-launch
 * informational banner is deployed.
 */
export const PreLaunchUpgradeBanner = () => {
  return (
    <Box
      role="alert"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        maxWidth: 1112,
        width: "100%",
        minHeight: 187,
        p: `${BCDesignTokens.layoutPaddingSmall} ${BCDesignTokens.layoutPaddingSmall} 0 ${BCDesignTokens.layoutPaddingSmall}`,
        gap: BCDesignTokens.layoutMarginSmall,
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
        background: BCDesignTokens.supportSurfaceColorWarning,
        mx: "auto",
      }}
    >
      <Box
        sx={{
          pt: 0,
          px: BCDesignTokens.layoutPaddingSmall,
          pb: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          color={BCDesignTokens.typographyColorPrimary}
        >
          Upgrades are coming to EPIC.submit
        </Typography>
        <Typography
          variant="body1"
          color={BCDesignTokens.typographyColorPrimary}
          sx={{ mt: "2em" }}
        >
          We are making improvements to EPIC.submit. To finish the update,{" "}
          <Box
            component="span"
            sx={{ fontWeight: BCDesignTokens.typographyFontWeightsBold }}
          >
            the site will be unavailable for a few hours on September 22,
            starting at 3 pm PDT.
          </Box>
        </Typography>
        <Typography
          variant="body1"
          color={BCDesignTokens.typographyColorPrimary}
          sx={{ mt: "2em" }}
        >
          Please plan your submissions around this window.
        </Typography>
      </Box>
    </Box>
  );
};
