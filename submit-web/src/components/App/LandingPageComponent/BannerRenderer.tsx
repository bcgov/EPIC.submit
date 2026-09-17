import { Box } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import DOMPurify from "dompurify";
import { BANNER_TYPE, BannerType } from "@/models/BannerConfiguration";
import { useGetActiveBanner } from "@/hooks/api/useBannerConfigurations";

type BannerStyle = {
  background: string;
  border: string;
};

/**
 * Maps a banner type to its surface/border colours. The "None" type renders
 * with no background and no border so plain content can be shown.
 */
const getBannerStyle = (bannerType: BannerType): BannerStyle => {
  switch (bannerType) {
    case BANNER_TYPE.INFO:
      return {
        background: BCDesignTokens.supportSurfaceColorInfo,
        border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
      };
    case BANNER_TYPE.SUCCESS:
      return {
        background: BCDesignTokens.supportSurfaceColorSuccess,
        border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
      };
    case BANNER_TYPE.WARNING:
      return {
        background: BCDesignTokens.supportSurfaceColorWarning,
        border: `1px solid ${BCDesignTokens.supportBorderColorWarning}`,
      };
    case BANNER_TYPE.FAILURE:
      return {
        background: BCDesignTokens.supportSurfaceColorDanger,
        border: `1px solid ${BCDesignTokens.supportBorderColorDanger}`,
      };
    case BANNER_TYPE.NONE:
    default:
      return {
        background: "transparent",
        border: "none",
      };
  }
};

/**
 * Renders the single active banner configuration on the public welcome page.
 * Content is authored via the rich text editor and stored as HTML; it is
 * sanitized before rendering. Renders nothing when no banner is active.
 */
export const BannerRenderer = () => {
  const { data: banner } = useGetActiveBanner();

  if (!banner || !banner.content) {
    return null;
  }

  const { background, border } = getBannerStyle(banner.banner_type);
  const sanitizedContent = DOMPurify.sanitize(banner.content);
  const isAlert =
    banner.banner_type === BANNER_TYPE.WARNING ||
    banner.banner_type === BANNER_TYPE.FAILURE;

  return (
    <Box
      px={3}
      mb={BCDesignTokens.layoutMarginLarge}
      display="flex"
      justifyContent="center"
    >
      <Box
        role={isAlert ? "alert" : "status"}
        sx={{
          maxWidth: 1112,
          width: "100%",
          p: BCDesignTokens.layoutPaddingSmall,
          borderRadius: BCDesignTokens.layoutBorderRadiusMedium,
          border,
          background,
          mx: "auto",
          color: BCDesignTokens.typographyColorPrimary,
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </Box>
  );
};
