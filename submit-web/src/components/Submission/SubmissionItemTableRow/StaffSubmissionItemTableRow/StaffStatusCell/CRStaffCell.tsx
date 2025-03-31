import {
  SubmissionStatusChip,
  SubmissionStatusChipStack,
} from "@/components/SubmissionStatusChip";
import { useGetFailedSubmissionsByItemId } from "@/hooks/api/useSubmissions";
import { PackageStatus } from "@/models/Package";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";

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
  const { data: failedSubmissions } =
    useGetFailedSubmissionsByItemId(submissionItemId);
  console.log("failedSubmissions", failedSubmissions);
  return (
    <>
      <SubmissionStatusChipStack
        status={status}
        isUpdateRequested={isUpdateRequested}
        isUpdated={isUpdated}
        packageStatus={packageStatus}
      />
      {failedSubmissions && failedSubmissions.length > 0 && (
        <SubmissionStatusChip
          status={NON_CANONICAL_SUBMISSION_STATUS.PREVIOUSLY_FAILED}
        />
      )}
    </>
  );
};
