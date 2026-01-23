import {
  SUBMISSION_ITEM_TYPE,
  SubmissionItem as TypeSubmissionItem,
} from "@/models/SubmissionItem";
import { ManagementPlanSubmissionProponentView } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanProponentView";
import { ConsultationRecordUpdateForm } from "@/components/App/SubmissionItem/ConsultationRecord/ConsultationRecordUpdateForm";
import { ConsultationRecordProponentView } from "@/components/App/SubmissionItem/ConsultationRecord/ConsultationRecordProponentView";
import { ManagementPlanUpdateForm } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanUpdateForm";
import { ContactInformationEntityView } from "@/components/App/SubmissionItem/ContactInformation/ContactInformationEntityView";
import { IemSubmissionProponentView } from "@/components/App/SubmissionItem/IEMSubmission/IEMProponentView";
import { IEMUpdateForm } from "@/components/App/SubmissionItem/IEMSubmission/IEMUpdateForm";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};

const createFormMap = {
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: ContactInformationEntityView,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: ManagementPlanSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordProponentView,
  [SUBMISSION_ITEM_TYPE.IEM]: IemSubmissionProponentView,
};

export const ProponentItemForm = ({ submissionItem }: ItemFormProps) => {
  const Component = createFormMap[submissionItem.type.name];
  return Component ? <Component /> : null;
};

const updateFormMap = {
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordUpdateForm,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: ManagementPlanUpdateForm,
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: ContactInformationEntityView,
  [SUBMISSION_ITEM_TYPE.IEM]: IEMUpdateForm,
};

export const ProponentItemUpdateForm = ({ submissionItem }: ItemFormProps) => {
  const Component = updateFormMap[submissionItem.type.name];
  return Component ? <Component /> : null;
};
