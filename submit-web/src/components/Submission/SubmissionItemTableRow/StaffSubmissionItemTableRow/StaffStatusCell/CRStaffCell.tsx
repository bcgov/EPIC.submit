import { SubmissionStatusChipStack } from "@/components/SubmissionStatusChip";
import { PackageStatus } from "@/models/Package";
import { SubmissionItemStatus } from "@/models/Submission";

type CRStaffCellProps = Readonly<{
  status?: SubmissionItemStatus;
  isUpdateRequested: boolean;
  isUpdated: boolean;
  packageStatus: PackageStatus[];
  submissionItemId: number;
}>;
export const CRStaffCell = ({
  status,
  isUpdateRequested,
  isUpdated,
  packageStatus,
  submissionItemId,
}: CRStaffCellProps) => {
  return (
    <SubmissionStatusChipStack
      status={status}
      isUpdateRequested={isUpdateRequested}
      isUpdated={isUpdated}
      packageStatus={packageStatus}
    />
  );
};
