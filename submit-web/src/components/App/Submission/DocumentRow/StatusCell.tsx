import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { UpdateRequest } from "@/models/UpdateRequest";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Stack } from "@mui/material";
import { useIsNewVersion } from "@/hooks/useIsNewVersion";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
  itemTypeId?: number;
  updateRequests?: UpdateRequest[];
}>;

export const StatusCell = ({
  submittedDocument,
  itemTypeId,
  updateRequests,
}: StatusCellProps) => {
  const { userType } = useAccount();
  const isStaff = userType === USER_TYPE.STAFF;

  const isNewVersion = useIsNewVersion({
    submission: submittedDocument,
    itemTypeId,
    updateRequests,
  });

  return (
    <Stack direction="column" spacing={0.5} alignItems="flex-start">
      {isNewVersion && (
        <SubmissionStatusChip
          status={NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION}
        />
      )}
      {isStaff && submittedDocument.status === SUBMISSION_STATUS.REJECTED && (
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.FAILED} />
      )}
      {isStaff && submittedDocument.status === SUBMISSION_STATUS.VERIFIED && (
        <SubmissionStatusChip status={SUBMISSION_STATUS.VERIFIED} />
      )}
      {isStaff && submittedDocument.status === SUBMISSION_STATUS.ACKNOWLEDGED && (
        <SubmissionStatusChip
          status={SUBMISSION_STATUS.ACKNOWLEDGED}
          showIcon
        />
      )}
    </Stack>
  );
};
