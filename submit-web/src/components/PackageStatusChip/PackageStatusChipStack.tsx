import {
  NON_CANONICAL_PACKAGE_STATUS,
  SubmissionPackage,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { When } from "react-if";
import { UPDATE_REQUEST_TYPE } from "@/models/UpdateRequest";
import { useMemo } from "react";
import { filterOpenUpdateRequests } from "@/utils";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
  hideReviewStatus?: boolean;
};
export const PackageStatusChipStack = ({
  submissionPackage,
  hideReviewStatus = false,
}: PackageStatusChipStackProps) => {
  const { status, review_status } = submissionPackage;

  const isUpdateRequested = useMemo(() => {
    return (
      filterOpenUpdateRequests(submissionPackage.update_requests).length > 0
    );
  }, [submissionPackage.update_requests]);

  const isRevisionRequired = useMemo(() => {
    return (
      submissionPackage.update_requests.filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value,
      ).length > 0
    );
  }, [submissionPackage.update_requests]);

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
        <When condition={isRevisionRequired}>
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.REVISION_REQUIRED}
          />
        </When>
      </Stack>
    </Box>
  );
};
