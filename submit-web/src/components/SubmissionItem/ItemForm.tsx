import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { Case, Default, Switch } from "react-if";
import { ContactInformation } from "./ContactInformation";
import { ManagementPlanSubmission } from "./ManagementPlanSubmission";
import { ConsultationRecord } from "./ConsultationRecord";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};
export const ItemForm = ({ submissionItem }: ItemFormProps) => {
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
        <ManagementPlanSubmission />
      </Case>
      <Case
        condition={
          submissionItem.type.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD
        }
      >
        <ConsultationRecord />
      </Case>
      <Default>
        <div>Default</div>
      </Default>
    </Switch>
  );
};
