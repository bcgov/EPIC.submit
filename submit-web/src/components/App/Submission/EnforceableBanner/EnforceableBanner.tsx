import { ReactNode } from "react";
import { BCDesignTokens } from "epic.theme";
import { Typography } from "@mui/material";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import { SuccessBox } from "@/components/Shared/Layouts/SuccessBox";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { EnforceableBannerType } from "./useEnforceableBanner";

type EnforceableBannerProps = {
  bannerType: EnforceableBannerType;
  /** Text (or custom node) shown in the "Enforceable" banner. */
  enforceableText: ReactNode;
  /** Text (or custom node) shown in the "Not Enforceable" banner. */
  notEnforceableText: ReactNode;
};

/**
 * Renders the "Enforceable" / "Not Enforceable" banner based on the
 * bannerType produced by useEnforceableBanner. Renders nothing when
 * bannerType is "none".
 */
export const EnforceableBanner = ({
  bannerType,
  enforceableText,
  notEnforceableText,
}: EnforceableBannerProps) => {
  if (bannerType === "enforceable") {
    return (
      <SuccessBox
        sx={{
          mb: BCDesignTokens.layoutMarginMedium,
          py: BCDesignTokens.layoutPaddingXsmall,
          px: BCDesignTokens.layoutPaddingSmall,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "fit-content",
        }}
      >
        <GppGoodOutlinedIcon fontSize="large" />
        <Typography
          variant="body2"
          color={BCDesignTokens.typographyColorPrimary}
        >
          {enforceableText}
        </Typography>
      </SuccessBox>
    );
  }

  if (bannerType === "not-enforceable") {
    return (
      <WarningBox
        sx={{
          mb: BCDesignTokens.layoutMarginMedium,
          py: BCDesignTokens.layoutPaddingSmall,
        }}
      >
        <Typography
          variant="body2"
          color={BCDesignTokens.typographyColorPrimary}
        >
          {notEnforceableText}
        </Typography>
      </WarningBox>
    );
  }

  return null;
};
