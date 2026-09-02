import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type ApprovalBannerProps = {
  contactEmail: string;
};

export const ApprovalBanner = ({ contactEmail }: ApprovalBannerProps) => {
  return (
    <Box
      sx={{
        background: BCDesignTokens.supportSurfaceColorInfo,
        border: `1px solid ${BCDesignTokens.supportBorderColorInfo}`,
        borderRadius: 1,
        mb: BCDesignTokens.layoutMarginXlarge,
        py: BCDesignTokens.layoutPaddingMedium,
        px: BCDesignTokens.layoutPaddingSmall,
      }}
    >
      <Typography variant="body1" color="black">
        If you have any questions or need assistance to add, replace, or delete documents in your submission, please contact the EAO at{" "}
        <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
      </Typography>
    </Box>
  );
};
