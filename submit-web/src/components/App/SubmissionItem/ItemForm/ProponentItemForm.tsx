import { AdditionalInformationProponentView } from "@/components/App/SubmissionItem/AdditionalInformation/ProponentView";
import { AdditionalInformationUpdateForm } from "@/components/App/SubmissionItem/AdditionalInformation/UpdateForm";
import { ConsultationRecordProponentView } from "@/components/App/SubmissionItem/ConsultationRecord/ConsultationRecordProponentView";
import { ConsultationRecordUpdateForm } from "@/components/App/SubmissionItem/ConsultationRecord/ConsultationRecordUpdateForm";
import { ContactInformationEntityView } from "@/components/App/SubmissionItem/ContactInformation/ContactInformationEntityView";
import { EarlyEngagementChecklistProponentView } from "@/components/App/SubmissionItem/EAChecklist/ProponentView/index";
import { EngagementPlanProponentView } from "@/components/App/SubmissionItem/EPSubmission/EPProponentView";
import { EngagementPlanUpdateForm } from "@/components/App/SubmissionItem/EPSubmission/EPUpdateForm";
import { GeoSpatialProponentView } from "@/components/App/SubmissionItem/GeoSpatialInformation/GeoSpatialProponentView";
import { GeoSpatialUpdateForm } from "@/components/App/SubmissionItem/GeoSpatialInformation/GeoSpatialUpdateForm";
import { IemSubmissionProponentView } from "@/components/App/SubmissionItem/IEMSubmission/IEMProponentView";
import { IEMUpdateForm } from "@/components/App/SubmissionItem/IEMSubmission/IEMUpdateForm";
import { IPDSubmissionProponentView } from "@/components/App/SubmissionItem/IPDSubmission/IPDProponentView";
import { IPDUpdateForm } from "@/components/App/SubmissionItem/IPDSubmission/IPDUpdateForm";
import { ManagementPlanSubmissionProponentView } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanProponentView";
import { ManagementPlanUpdateForm } from "@/components/App/SubmissionItem/ManagementPlanSubmission/ManagementPlanUpdateForm";
import {
  SubmissionItem as TypeSubmissionItem, SUBMISSION_ITEM_TYPE
} from "@/models/SubmissionItem";
import { EarlyEngagementChecklistUpdateForm } from "../EAChecklist/UpdateForm/index";

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
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: GeoSpatialProponentView,
  [SUBMISSION_ITEM_TYPE.UPLOAD_DOCUMENT]: AdditionalInformationProponentView,
  [SUBMISSION_ITEM_TYPE.EARLY_ENGAGEMENT_CHECKLIST]: EarlyEngagementChecklistProponentView,
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
  [SUBMISSION_ITEM_TYPE.IPD]: IPDUpdateForm,
  [SUBMISSION_ITEM_TYPE.ENGAGEMENT_PLAN]: EngagementPlanUpdateForm,
  [SUBMISSION_ITEM_TYPE.GEOSPATIAL_INFORMATION]: GeoSpatialUpdateForm,
  [SUBMISSION_ITEM_TYPE.UPLOAD_DOCUMENT]: AdditionalInformationUpdateForm,
  [SUBMISSION_ITEM_TYPE.EARLY_ENGAGEMENT_CHECKLIST]: EarlyEngagementChecklistUpdateForm,
};

export const ProponentItemUpdateForm = ({ submissionItem }: ItemFormProps) => {
  const Component = updateFormMap[submissionItem.type.name];
  return Component ? <Component /> : <></>;
};
