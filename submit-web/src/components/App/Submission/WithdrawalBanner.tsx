import { Link, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";
import { AppConfig } from "@/utils/config";
import { BCDesignTokens } from "epic.theme";

type WithdrawalBannerProps = {
  packageTypeName: string;
  nextPackageNumber: number;
};

const WithdrawalBanner = ({ packageTypeName, nextPackageNumber }: WithdrawalBannerProps) => {
  return (
    <WarningBox
      sx={{
        mb: BCDesignTokens.layoutMarginXlarge,
        py: BCDesignTokens.layoutPaddingMedium,
        px: BCDesignTokens.layoutPaddingSmall,
      }}
    >
      <Typography variant="body1" color={BCDesignTokens.typographyColorPrimary}>
        Your {packageTypeName} Submission has been withdrawn. To resubmit,
        select Package {nextPackageNumber} above to begin a new submission.
      </Typography>
      <Typography
        variant="body1"
        color={BCDesignTokens.typographyColorPrimary}
        sx={{ mt: 1 }}
      >
        If you have any questions, please contact the EAO at{" "}
        <Link href={`mailto:${AppConfig.supportEmail}`}>
          {AppConfig.supportEmail}
        </Link>
        .
      </Typography>
    </WarningBox>
  );
};

export default WithdrawalBanner;
