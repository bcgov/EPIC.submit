import {
  SubmissionPackage,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
};
export const PackageStatusChipStack = ({
  submissionPackage,
}: PackageStatusChipStackProps) => {
  const { status } = submissionPackage;

  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {status.map((value) => (
          <PackageStatusChip key={value} status={value} />
        ))}
        {/* <When condition={isUpdateRequested && !isUpdated}>
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.UPDATE_REQUESTED}
          />
        </When>
        <When condition={isRevisionRequired && !isUpdated}>
          <PackageStatusChip
            status={
              isProponent
                ? NON_CANONICAL_PACKAGE_STATUS.REVISION_REQUIRED
                : NON_CANONICAL_PACKAGE_STATUS.REVISION_REQUESTED
            }
          />
        </When>
        <When condition={isUpdated}>
          <PackageStatusChip status={NON_CANONICAL_PACKAGE_STATUS.UPDATED} />
        </When> */}
      </Stack>
    </Box>
  );
};
