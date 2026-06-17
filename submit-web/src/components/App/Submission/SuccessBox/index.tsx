import { PackageType } from "@/models/Package";
import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { AppConfig } from "@/utils/config";

type SuccessBoxProps = {
  submissionPackageType: PackageType;
};
export const SubmissionSuccessBox = ({
  submissionPackageType,
}: SuccessBoxProps) => {
  return (
    <Box
      sx={{
        background: BCDesignTokens.supportSurfaceColorSuccess,
        border: `1px solid ${BCDesignTokens.supportBorderColorSuccess}`,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          padding: "8px",
        }}
      >
        {submissionPackageType.success_message && (
          <Typography variant="body1" color={"black"}>
            {submissionPackageType.success_message}
          </Typography>
        )}
        <Typography variant="body1" mt="40px" color={"black"}>
          If you have any questions or need to add, replace, or delete documents
          in your submission, please contact the EAO at {" "}
          <Link href={`mailto:${AppConfig.supportMpEmail}`}>
            {AppConfig.supportMpEmail}
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};
