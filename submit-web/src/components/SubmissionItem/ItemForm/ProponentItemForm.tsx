import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { ContactInformation } from "../ContactInformation";
import { ManagementPlanSubmissionProponentView } from "../ManagementPlanSubmission/ManagementPlanProponentView";
import { ConsultationRecordUpdateForm } from "../ConsultationRecord/ConsultationRecordUpdateForm";
import { ConsultationRecordProponentView } from "../ConsultationRecord/ConsultationRecordProponentView";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};

const createFormMap = {
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: ContactInformation,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: ManagementPlanSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordProponentView,
};

export const ProponentItemForm = ({ submissionItem }: ItemFormProps) => {
  const Component = createFormMap[submissionItem.type.name];
  return Component ? <Component /> : null;
};

const updateFormMap = {
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordUpdateForm,
};

export const ProponentItemUpdateForm = ({ submissionItem }: ItemFormProps) => {
  const Component = updateFormMap[submissionItem.type.name];
  return Component ? <Component /> : null;
};
