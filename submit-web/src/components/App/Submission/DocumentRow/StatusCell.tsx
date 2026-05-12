import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Case, Default, Switch } from "react-if";
import { useGetSubmissionVersions } from "@/hooks/api/useSubmissions";
import { useMemo } from "react";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

export const  StatusCell = ({ submittedDocument }: StatusCellProps) => {
  const { userType } = useAccount();
  const entityUser = userType === USER_TYPE.PROPONENT;
  const { data: versions } = useGetSubmissionVersions(submittedDocument.id);

  const isNewVersion = useMemo(() => {
    if (!versions || submittedDocument.status !== SUBMISSION_STATUS.SUBMITTED)
      return false;
    // Check if any previous version was VERIFIED
    return versions.some((v) => v.status === SUBMISSION_STATUS.VERIFIED);
  }, [versions, submittedDocument.status]);

  return (
    <Switch>
      <Case condition={entityUser}>{null}</Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.REJECTED}>
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.FAILED} />
      </Case>
      <Case condition={isNewVersion}>
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.NEW_VERSION} />
      </Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.VERIFIED}>
        <SubmissionStatusChip status={SUBMISSION_STATUS.VERIFIED} />
      </Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.ACKNOWLEDGED}>
        <SubmissionStatusChip status={SUBMISSION_STATUS.ACKNOWLEDGED} />
      </Case>
      <Default>{null}</Default>
    </Switch>
  );
};
