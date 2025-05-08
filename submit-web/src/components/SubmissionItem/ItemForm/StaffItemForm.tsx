import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { Case, Switch } from "react-if";
import { ManagementPlanSubmissionStaffView } from "../ManagementPlanSubmission/ManagementPlanStaffView";
import { ConsultationRecordStaffView } from "../ConsultationRecord/ConsultationRecordStaffView";
import { ContactInformationStaffView } from "../ContactInformation/ContactInformationStaffView";
import { IEMStaffView } from "../IEMSubmission/IEMStaffView";

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
        <ContactInformationStaffView />
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
      <Case condition={submissionItem.type.name === SUBMISSION_ITEM_TYPE.IEM}>
        <IEMStaffView />
      </Case>
    </Switch>
  );
};
