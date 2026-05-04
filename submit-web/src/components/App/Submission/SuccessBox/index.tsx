import { SubmissionPackageType } from "@/models/Package";
import { PackageType } from "@/models/Package";
import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { Case, Default, Switch } from "react-if";
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
      <Switch>
        <Case
          condition={
            submissionPackageType.name ===
            SubmissionPackageType.ADDITIONAL_INFORMATION
          }
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
            <Typography variant="body1" color={"black"}>
              Your Additional Information Submission has been successfully
              submitted to the EAO. You will also receive an email to confirm
              your submission.
            </Typography>
            <Typography variant="body1" mt="40px" color={"black"}>
              If you need to add some files to your submission, you can add them
              and resubmit your submission package at anytime. If you have any
              questions, please contact the EAO at{" "}
              <Link href={`mailto:${AppConfig.supportEmail}`}>
                {AppConfig.supportEmail}
              </Link>
              .
            </Typography>
          </Box>
        </Case>
        <Case
          condition={
            submissionPackageType.name === SubmissionPackageType.MANAGEMENT_PLAN
          }
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
            <Typography variant="body1" color={"black"}>
              Your plan has been successfully submitted to the EAO. You will
              also receive an email to confirm your submission.
            </Typography>
            <Typography variant="body1" mt="40px" color={"black"}>
              If you have any questions or need to add, replace, or delete
              documents in your submission, please contact the EAO at{" "}
              <Link href={`mailto:${AppConfig.supportEmail}`}>
                {AppConfig.supportEmail}
              </Link>
              .
            </Typography>
          </Box>
        </Case>
        <Case
          condition={submissionPackageType.name === SubmissionPackageType.IEM}
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
            <Typography variant="body1" color={"black"}>
              Your Independent Environmental Monitor Terms of Engagement has
              been successfully submitted to the EAO. You will also receive an
              email to confirm your submission.
            </Typography>
            <Typography variant="body1" mt="40px" color={"black"}>
              If you have any questions, or need to add, replace, or delete
              documents in your submission, please contact the EAO at{" "}
              <Link href={`mailto:${AppConfig.supportEmail}`}>
                {AppConfig.supportEmail}
              </Link>
              .
            </Typography>
          </Box>
        </Case>

        <Default></Default>
      </Switch>
    </Box>
  );
};
