import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { Case, Switch } from "react-if";
import { ContactInformation } from "../ContactInformation";
import { ManagementPlanSubmissionStaffView } from "../ManagementPlanSubmission/ManagementPlanStaffView";
import { ConsultationRecordStaffView } from "../ConsultationRecord/ConsultationRecordStaffView";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};
export const StaffItemForm = ({ submissionItem }: ItemFormProps) => {
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
        <ManagementPlanSubmissionStaffView />
      </Case>
      <Case
        condition={
          submissionItem.type.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD
        }
      >
        <ConsultationRecordStaffView />
      </Case>
    </Switch>
  );
};
