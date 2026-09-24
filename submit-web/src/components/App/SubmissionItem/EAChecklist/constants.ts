import * as yup from "yup";

export const earlyEngagementChecklistSchema = yup.object().shape({
  uploadDocuments: yup.array().of(yup.string()),
});

export type EarlyEngagementChecklistForm = yup.InferType<typeof earlyEngagementChecklistSchema>;

export const EARLY_ENGAGEMENT_CHECKLIST_DOCUMENT_FOLDERS = Object.freeze({
  UPLOAD_DOCUMENTS: "upload_documents",
});

export const eaChecklistDocURL = "https://www2.gov.bc.ca/assets/gov/environment/natural-resource-stewardship/environmental-assessments/guidance-documents/2018-act/eao_early_engagement_guide.pdf"