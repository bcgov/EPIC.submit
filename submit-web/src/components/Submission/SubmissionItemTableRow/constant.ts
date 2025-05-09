import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";

export const SubmissionItemTypeLabelMap = {
  [SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION]: "Contact Information Form",
  [SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN]: "Management Plan",
  [SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD]: "Consultation Record(s)",
  [SUBMISSION_ITEM_TYPE.IEM]:
    "Independent Engagement Monitor Terms of Engagement",
};
