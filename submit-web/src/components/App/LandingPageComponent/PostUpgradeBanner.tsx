import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AppConfig } from "@/utils/config";

/**
 * Post-launch upgrade announcement banner shown on the public welcome page.
 *
 * This is an informational, non-dismissible banner that replaces the pre-launch
 * warning banner after go-live. Its content is fixed in code; visibility is
 * controlled at deploy time via the `VITE_SHOW_POST_UPGRADE_BANNER` runtime
 * config flag (see AppConfig.showPostUpgradeBanner).
 *
 * The inline "User Guide" link points to the same URL (AppConfig.userGuide) as
 * the welcome page's right-column link, so both open the same guide file.
 */
export const PostUpgradeBanner = () => {
  const supportEmail = AppConfig.epicSystemEmail;

  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        maxWidth: 1112,
        width: "100%",
        minHeight: 323,
        p: BCDesignTokens.layoutPaddingSmall,
        gap: BCDesignTokens.layoutMarginSmall,
        borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
        border: `1px solid ${BCDesignTokens.iconsColorInfo}`,
        background: BCDesignTokens.supportSurfaceColorInfo,
        mx: "auto",
      }}
    >
      <Box sx={{ p: BCDesignTokens.layoutPaddingSmall }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color={BCDesignTokens.typographyColorPrimary}
          gutterBottom
        >
          EPIC.submit has been upgraded
        </Typography>

        <Typography
          variant="body1"
          color={BCDesignTokens.typographyColorPrimary}
        >
          You may notice some changes to how EPIC.submit looks and works. Some
          of the improvements you'll see:
        </Typography>

        <Box component="ul" sx={{ mt: 1, mb: 0 }}>
          <Typography
            component="li"
            variant="body1"
            color={BCDesignTokens.typographyColorPrimary}
          >
            A refreshed Document Library that's easier to navigate.
          </Typography>
          <Typography
            component="li"
            variant="body1"
            color={BCDesignTokens.typographyColorPrimary}
          >
            A clearer Update Request that makes it easier to see what's being
            asked and respond.
          </Typography>
          <Typography
            component="li"
            variant="body1"
            color={BCDesignTokens.typographyColorPrimary}
          >
            A new Regulated Party Account Administrator role, plus the ability
            to revoke a user's access and view a history of changes to each
            user's account, all in User Management.
          </Typography>
        </Box>

        <Typography
          variant="body1"
          color={BCDesignTokens.typographyColorPrimary}
          sx={{ mt: BCDesignTokens.layoutMarginMedium }}
        >
          Please refer to the updated{" "}
          <Link
            href={AppConfig.userGuide}
            target="_blank"
            rel="noopener noreferrer"
          >
            User Guide
          </Link>{" "}
          for more details about the new features.
        </Typography>

        <Typography
          variant="body1"
          color={BCDesignTokens.typographyColorPrimary}
          sx={{ mt: BCDesignTokens.layoutMarginSmall }}
        >
          If you notice something doesn't work as expected, contact{" "}
          <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
        </Typography>
      </Box>
    </Box>
  );
};
