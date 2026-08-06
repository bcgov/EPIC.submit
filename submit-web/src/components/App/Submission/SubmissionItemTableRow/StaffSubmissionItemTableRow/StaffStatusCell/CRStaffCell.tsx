import {
  SubmissionStatusChip,
  SubmissionStatusChipStack,
} from "@/components/App/SubmissionStatusChip";
import { useGetFailedSubmissionsByItemId } from "@/hooks/api/useSubmissions";
import { PackageStatus } from "@/models/Package";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  SubmissionItemStatus,
} from "@/models/Submission";

type CRStaffCellProps = Readonly<{
  status?: SubmissionItemStatus;
  packageStatus: PackageStatus[];
  submissionItemId: number;
}>;
export const CRStaffCell = ({
  status,
  packageStatus,
  submissionItemId,
}: CRStaffCellProps) => {
  const { data: failedSubmissions } =
    useGetFailedSubmissionsByItemId(submissionItemId);
  return (
    <>
      <SubmissionStatusChipStack
        status={status}
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
