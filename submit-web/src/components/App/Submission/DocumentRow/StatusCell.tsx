import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Stack } from "@mui/material";
import { useIsNewVersion } from "@/hooks/useIsNewVersion";
import { useIsNewDocument } from "@/hooks/useIsNewDocument";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

export const StatusCell = ({
  submittedDocument,
}: StatusCellProps) => {
  const { userType } = useAccount();
  const isStaff = userType === USER_TYPE.STAFF;

  const isNewVersion = useIsNewVersion({
    submission: submittedDocument,
  });

  const isNewDocument = useIsNewDocument({
    submission: submittedDocument,
  });

  return (
    <Stack direction="column" spacing={0.5} alignItems="flex-start">
      {isNewVersion && (
        <SubmissionStatusChip
          status={NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION}
        />
      )}
      {/* New Document is staff-only and never shown alongside New Version */}
      {isStaff && isNewDocument && !isNewVersion && (
        <SubmissionStatusChip
          status={NON_CANONICAL_SUBMISSION_STATUS.NEW_DOCUMENT}
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
