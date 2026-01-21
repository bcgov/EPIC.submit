import { SubmissionStatusChip } from "@/components/App/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { USER_TYPE } from "@/models/User";
import { useAccount } from "@/store/accountStore";
import { Case, Default, Switch } from "react-if";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

export const StatusCell = ({ submittedDocument }: StatusCellProps) => {
  const { userType } = useAccount();
  const entityUser = userType === USER_TYPE.PROPONENT;
  return (
    <Switch>
      <Case condition={entityUser}>{null}</Case>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.REJECTED}>
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.FAILED} />
      </Case>
      <Default>{null}</Default>
    </Switch>
  );
};
