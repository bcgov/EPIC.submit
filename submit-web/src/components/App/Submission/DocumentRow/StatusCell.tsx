import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
  SubmissionStatus,
  NonCanonicalSubmissionStatus,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import CheckIcon from "@mui/icons-material/Check";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

// Map internal statuses to desired display statuses.
// If a status isn't in this map, we can fall back to the original.
const STATUS_DISPLAY_MAP: Partial<
  Record<SubmissionStatus, NonCanonicalSubmissionStatus>
> = {
  [SUBMISSION_STATUS.REJECTED]: NON_CANONICAL_SUBMISSION_STATUS.FAILED,
};

export const StatusCell = ({ submittedDocument }: StatusCellProps) => {
  const { userType } = useAccount();
  const { status } = submittedDocument;

  if (userType === USER_TYPE.PROPONENT) {
    return null;
  }

  if (userType === USER_TYPE.STAFF && status === SUBMISSION_STATUS.SUBMITTED) {
    return null;
  }

  const displayStatus = STATUS_DISPLAY_MAP[status] ?? status;

  return (
    <SubmissionStatusChip
      status={displayStatus}
      icon={<CheckIcon color="success" fontSize="small" />}
    />
  );
};
