import { Link, Typography } from "@mui/material";
import WarningBox from "@/components/Shared/Layouts/WarningBox";

type NotApprovedBannerProps = {
  contactEmail: string;
  packageTypeName: string;
  nextVersion: number;
};

export const NotApprovedBanner = ({
  contactEmail,
  packageTypeName,
  nextVersion,
}: NotApprovedBannerProps) => {
  return (
    <WarningBox>
      <Typography variant="body1">
        Your {packageTypeName} has not been approved. To submit a new{" "}
        {packageTypeName} package, select Package {nextVersion} above, upload
        your documents, and click the &quot;Submit to EAO&quot; button.
      </Typography>
      <Typography variant="body1" mt="20px">
        If you have any questions, please contact the EAO at{" "}
        <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
      </Typography>
    </WarningBox>
  );
};
