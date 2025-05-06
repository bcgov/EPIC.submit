import { SubmissionPackageType } from "@/components/Shared/types";
import { PackageType } from "@/models/Package";
import { Box, Link, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { Case, Default, Switch } from "react-if";

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
              If you have any question, or need to add or replace documents in
              your submission, please contact the EAO at{" "}
              <Link>EAO.ManagementPlanSupport@gov.bc.ca</Link>.
            </Typography>
          </Box>
        </Case>
        <Default></Default>
      </Switch>
    </Box>
  );
};
