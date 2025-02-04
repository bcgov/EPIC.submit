import {
  NON_CANONICAL_PACKAGE_STATUS,
  PACKAGE_STATUS,
  PackageStatus,
  SubmissionPackage,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { Unless, When } from "react-if";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import { useCallback, useMemo } from "react";
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
          updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value &&
          updateRequest.active,
      ).length > 0
    );
  }, [submissionPackage.update_requests]);

  const isUpdated = useMemo(() => {
    return (
      submissionPackage.update_requests.filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.UPDATE.value &&
          updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
          updateRequest.active,
      ).length > 0
    );
  }, [submissionPackage.update_requests]);

  const hideStatus = useCallback(
    (status: PackageStatus) => {
      const isNewOrCreated = [
        PACKAGE_STATUS.CREATED.value,
        PACKAGE_STATUS.NEW_SUBMISSION.value,
      ].includes(status);

      if (isNewOrCreated && isRevisionRequired) {
        return true;
      }
      const notFirstVersion = submissionPackage.version.version > 1;
      const alreadySubmitted = Boolean(submissionPackage.submitted_on);
      if (isNewOrCreated && (notFirstVersion || alreadySubmitted)) {
        return true;
      }
      return false;
    },
    [
      submissionPackage.submitted_on,
      submissionPackage.version.version,
      isRevisionRequired,
    ],
  );

  const hideStatusMap: Record<PackageStatus, boolean> = useMemo(() => {
    const entries = submissionPackage.status.map((status) => [
      status,
      hideStatus(status),
    ]);
    return Object.fromEntries(entries);
  }, [submissionPackage.status, hideStatus]);

  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {status.map((value) => (
          <Unless condition={hideStatusMap[value]} key={value}>
            <PackageStatusChip key={value} status={value} />
          </Unless>
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
        <When condition={isUpdated}>
          <PackageStatusChip status={NON_CANONICAL_PACKAGE_STATUS.UPDATED} />
        </When>
      </Stack>
    </Box>
  );
};
