import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";

type ApprovalBannerProps = {
  contactEmail: string;
};

export const ApprovalBanner = ({ contactEmail }: ApprovalBannerProps) => {
  return (
    <Box
      sx={{
        background: BCDesignTokens.supportSurfaceColorSuccess,
        border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
        borderRadius: 1,
        mb: BCDesignTokens.layoutMarginXlarge,
        py: BCDesignTokens.layoutPaddingMedium,
        px: BCDesignTokens.layoutPaddingSmall,
      }}
    >
      <Typography variant="body1" color="black">
        Your submission has been approved.
      </Typography>
      <Typography variant="body1" mt="20px" color="black">
        If you have any questions, please contact the EAO at{" "}
        <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
      </Typography>
    </Box>
  );
};
