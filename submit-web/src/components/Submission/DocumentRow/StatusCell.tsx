import { SubmissionStatusChip } from "@/components/SubmissionStatusChip";
import {
  Submission,
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_STATUS,
} from "@/models/Submission";
import { SUBMISSION_ITEM_TYPE, SubmissionItem } from "@/models/SubmissionItem";
import { Case, Default, Switch } from "react-if";

type StatusCellProps = Readonly<{
  submittedDocument: Submission;
  submissionItem: SubmissionItem;
}>;

export const StatusCell = ({
  submittedDocument,
  submissionItem,
}: StatusCellProps) => {
  return (
    <Switch>
      <Case
        condition={
          submissionItem.type.name ===
            SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD &&
          submittedDocument.status === SUBMISSION_STATUS.REJECTED
        }
      >
        <SubmissionStatusChip
          status={SUBMISSION_ITEM_STATUS.FAILED_CONSULTATION_CHECK.value}
        />
      </Case>
      <Default>{null}</Default>
    </Switch>
  );
};
