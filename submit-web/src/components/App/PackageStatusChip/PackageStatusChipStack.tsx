import {
  SubmissionPackage,
  NON_CANONICAL_PACKAGE_STATUS,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

type PackageStatusChipStackProps = {
  submissionPackage: SubmissionPackage;
};
export const PackageStatusChipStack = ({
  submissionPackage,
}: PackageStatusChipStackProps) => {
  const { status, account_project_work, update_requests } = submissionPackage;

  // Check if package is work-related and has active update requests
  const hasAccountProjectWork = Boolean(account_project_work?.id);
  const hasActiveUpdateRequests = update_requests.some(
    (updateRequest) =>
      updateRequest.status === UPDATE_REQUEST_STATUS.OPEN.value &&
      updateRequest.active
  );

  // If work-related and has active update requests, show Update Requested badge instead
  const shouldShowUpdateRequested = hasAccountProjectWork && hasActiveUpdateRequests;

  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {shouldShowUpdateRequested ? (
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.UPDATE_REQUESTED}
          />
        ) : (
          status.map((value) => (
            <PackageStatusChip key={value} status={value} />
          ))
        )}
      </Stack>
    </Box>
  );
};
