import {
  NON_CANONICAL_PACKAGE_STATUS,
  PACKAGE_STATUS,
  SubmissionPackage,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { When } from "react-if";
import {
  UPDATE_REQUEST_STATUS,
  UPDATE_REQUEST_TYPE,
} from "@/models/UpdateRequest";
import { useMemo } from "react";
import { filterOpenUpdateRequests } from "@/utils";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
};
export const PackageStatusChipStack = ({
  submissionPackage,
}: PackageStatusChipStackProps) => {
  const { status } = submissionPackage;
  const { userType } = useAccount();
  const isProponent = userType === USER_TYPE.PROPONENT;

  const isUpdateRequested = useMemo(() => {
    return (
      filterOpenUpdateRequests(submissionPackage.update_requests).length > 0
    );
  }, [submissionPackage.update_requests]);

  const isRevisionRequired = useMemo(() => {
    if (
      status.some((_status) =>
        [
          PACKAGE_STATUS.COMPLETED.value,
          PACKAGE_STATUS.PARTIALLY_COMPLETED.value,
        ].includes(_status)
      )
    )
      return false;
    return (
      submissionPackage.update_requests.filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.REVIEW.value &&
          updateRequest.active
      ).length > 0
    );
  }, [submissionPackage.update_requests, status]);

  const isUpdated = useMemo(() => {
    return (
      submissionPackage.update_requests.filter(
        (updateRequest) =>
          updateRequest.type === UPDATE_REQUEST_TYPE.UPDATE.value &&
          updateRequest.status === UPDATE_REQUEST_STATUS.PENDING_REVIEW.value &&
          updateRequest.active
      ).length > 0
    );
  }, [submissionPackage.update_requests]);

  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {status.map((value) => (
          <PackageStatusChip key={value} status={value} />
        ))}
        <When condition={isUpdateRequested && !isUpdated}>
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.UPDATE_REQUESTED}
          />
        </When>
        <When condition={isRevisionRequired}>
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
        </When>
      </Stack>
    </Box>
  );
};
