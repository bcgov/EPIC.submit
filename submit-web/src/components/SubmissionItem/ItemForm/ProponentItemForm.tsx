import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { Case, Switch } from "react-if";
import { ContactInformation } from "../ContactInformation";
import { ManagementPlanSubmissionProponentView } from "../ManagementPlanSubmission/ManagementPlanProponentView";
import { ConsultationRecordUpdateForm } from "../ConsultationRecord/ConsultationRecordUpdateForm";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};
export const ProponentItemForm = ({ submissionItem }: ItemFormProps) => {
  return (
    <Switch>
      <Case
        condition={
          submissionItem.type.name === SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION
        }
      >
        <ContactInformation />
      </Case>
      <Case
        condition={
          submissionItem.type.name === SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN
        }
      >
        <ManagementPlanSubmissionProponentView />
      </Case>
      <Case
        condition={
          submissionItem.type.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD
        }
      >
        <ConsultationRecordUpdateForm />
      </Case>
    </Switch>
  );
};
