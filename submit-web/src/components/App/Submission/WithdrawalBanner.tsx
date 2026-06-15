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
        Your {packageTypeName} has been withdrawn. To submit a new{" "}
        {packageTypeName} package, select Package {nextPackageNumber} above,
        upload your documents, and click the "Submit to EAO" button.
      </Typography>
      <Typography
        variant="body1"
        color={BCDesignTokens.typographyColorPrimary}
        sx={{ mt: "20px" }}
      >
        If you have any questions, please contact the EAO at{" "}
        <Link href={`mailto:${AppConfig.supportIpdEmail}`}>
          {AppConfig.supportIpdEmail}.
        </Link>
      </Typography>
    </WarningBox>
  );
};

export default WithdrawalBanner;
