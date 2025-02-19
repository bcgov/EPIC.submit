import { SubmissionStatusChip } from "@/components/SubmissionStatusChip";
import {
  NON_CANONICAL_SUBMISSION_STATUS,
  Submission,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { Case, Default, Switch } from "react-if";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
}>;

export const StatusCell = ({ submittedDocument }: StatusCellProps) => {
  return (
    <Switch>
      <Case condition={submittedDocument.status === SUBMISSION_STATUS.REJECTED}>
        <SubmissionStatusChip status={NON_CANONICAL_SUBMISSION_STATUS.FAILED} />
      </Case>
      <Default>{null}</Default>
    </Switch>
  );
};
