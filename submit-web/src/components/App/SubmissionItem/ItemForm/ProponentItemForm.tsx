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
import { IPDSubmissionProponentView } from "@/components/App/SubmissionItem/IPDSubmission/IPDProponentView";
import { EngagementPlanProponentView } from "@/components/App/SubmissionItem/EPSubmission/EPProponentView";

type ItemFormProps = {
  submissionItem: TypeSubmissionItem;
};

const createFormMap = {
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: ContactInformationEntityView,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: ManagementPlanSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordProponentView,
  [SUBMISSION_ITEM_TYPE.IEM]: IemSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.IPD]: IPDSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.ENGAGEMENT_PLAN]: EngagementPlanProponentView,
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: ContactInformationEntityView, // TODO: Replace with actual component
};

export const ProponentItemForm = ({ submissionItem }: ItemFormProps) => {
  const Component = createFormMap[submissionItem.type.name];
  return Component ? <Component /> : <></>;
};

const updateFormMap = {
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: ConsultationRecordUpdateForm,
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: ManagementPlanUpdateForm,
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: ContactInformationEntityView,
  [SUBMISSION_ITEM_TYPE.IEM]: IEMUpdateForm,
  [SUBMISSION_ITEM_TYPE.IPD]: IPDSubmissionProponentView,
  [SUBMISSION_ITEM_TYPE.ENGAGEMENT_PLAN]: EngagementPlanProponentView,
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: ContactInformationEntityView, // TODO: Replace with actual component
};

export const ProponentItemUpdateForm = ({ submissionItem }: ItemFormProps) => {
  const Component = updateFormMap[submissionItem.type.name];
  return Component ? <Component /> : <></>;
};
