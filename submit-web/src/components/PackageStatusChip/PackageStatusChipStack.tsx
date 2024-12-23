import {
  NON_CANONICAL_PACKAGE_STATUS,
  SubmissionPackage,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { When } from "react-if";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
  hideReviewStatus?: boolean;
};
export const PackageStatusChipStack = ({
  submissionPackage,
  hideReviewStatus = false,
}: PackageStatusChipStackProps) => {
  const { status, review_status } = submissionPackage;
  const isUpdateRequested = submissionPackage.update_requests?.length > 0;
  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {status.map((value) => (
          <PackageStatusChip key={value} status={value} />
        ))}
        <When
          condition={
            review_status ===
              NON_CANONICAL_PACKAGE_STATUS.PENDING_MANAGER_REVIEW &&
            !hideReviewStatus
          }
        >
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.PENDING_MANAGER_REVIEW}
          />
        </When>
        <When condition={isUpdateRequested}>
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.UPDATE_REQUESTED}
          />
        </When>
      </Stack>
    </Box>
  );
};
