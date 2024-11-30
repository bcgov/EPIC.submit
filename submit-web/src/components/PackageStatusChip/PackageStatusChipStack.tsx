import {
  NON_CANONICAL_PACKAGE_STATUS,
  NonCanonicalPackageStatus,
  PackageStatus,
} from "@/models/Package";
import { Box, Stack } from "@mui/material";
import PackageStatusChip from ".";
import { When } from "react-if";

type PackageStatusChipStackProps = {
  status: PackageStatus[];
  reviewStatus?: NonCanonicalPackageStatus;
};
export const PackageStatusChipStack = ({
  status,
  reviewStatus,
}: PackageStatusChipStackProps) => {
  return (
    <Box sx={{ display: "inline-block", width: "fit-content" }}>
      <Stack direction="column" spacing={1} alignItems={"flex-end"}>
        {status.map((value) => (
          <PackageStatusChip key={value} status={value} />
        ))}
        <When
          condition={
            reviewStatus === NON_CANONICAL_PACKAGE_STATUS.PENDING_MANAGER_REVIEW
          }
        >
          <PackageStatusChip
            status={NON_CANONICAL_PACKAGE_STATUS.PENDING_MANAGER_REVIEW}
          />
        </When>
      </Stack>
    </Box>
  );
};
