import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Case, Default, Switch } from "react-if";
import { useMemo } from "react";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

export const StatusCell = ({ submittedDocument }: StatusCellProps) => {
  const { userType } = useAccount();
  const entityUser = userType === USER_TYPE.PROPONENT;

  const isNewVersion = useMemo(() => {
    // Show new version if minor version > 1 and status is PENDING or SUBMITTED
    if (
      submittedDocument.status !== SUBMISSION_STATUS.SUBMITTED &&
      submittedDocument.status !== SUBMISSION_STATUS.PENDING
    )
      return false;

    return submittedDocument.minor_version > 1;
  }, [submittedDocument.minor_version, submittedDocument.status]);

  return (
    <Switch>
      <Case condition={isNewVersion}>
        <SubmissionStatusChip
          status={NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION}
        />
      </Case>
      <Case condition={entityUser}>{null}</Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.REJECTED}>
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.FAILED} />
      </Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.VERIFIED}>
        <SubmissionStatusChip status={SUBMISSION_STATUS.VERIFIED} />
      </Case>
      <Case
        condition={submittedDocument.status === SUBMISSION_STATUS.ACKNOWLEDGED}
      >
        <SubmissionStatusChip
          status={SUBMISSION_STATUS.ACKNOWLEDGED}
          showIcon
        />
      </Case>
      <Default>{null}</Default>
    </Switch>
  );
};
