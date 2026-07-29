import { Link, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { BCDesignTokens } from "epic.theme";

type RevisionRequiredBannerProps = {
  contactEmail: string;
};

export const RevisionRequiredBanner = ({
  contactEmail,
}: RevisionRequiredBannerProps) => {
  return (
    <WarningBox
      sx={{
        mb: BCDesignTokens.layoutMarginXlarge,
        py: BCDesignTokens.layoutPaddingMedium,
        px: BCDesignTokens.layoutPaddingSmall,
      }}
    >
      <Typography variant="body1" color={BCDesignTokens.typographyColorPrimary}>
        Your plan requires revisions.
      </Typography>
      <Typography
        variant="body1"
        color={BCDesignTokens.typographyColorPrimary}
        sx={{ mt: "20px" }}
      >
        If you have any questions or need to add, replace, or delete documents
        in your submission, please contact the EAO at{" "}
        <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
      </Typography>
    </WarningBox>
  );
};
