import * as yup from "yup";

export const consultationRecordSchema = yup.object().shape({
  consultedParties: yup.array().of(
    yup.object().shape({
      consultedParty: yup.string(),
    }),
  ),
  allPartiesConsulted: yup.string().required("Please answer this question."),
  planWasReviewed: yup.string().required("Please answer this question."),
  writtenExplanationsProvidedToParties: yup
    .string()
    .required("Please answer this question."),
  writtenExplanationsProvidedToCommenters: yup
    .string()
    .required("Please answer this question."),
  consultationRecords: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
});

export type ConsultationRecordForm = yup.InferType<
  typeof consultationRecordSchema
>;

export const CONSULTATION_RECORD_DOCUMENT_FOLDERS = Object.freeze({
  CONSULTATION_RECORDS: "consultation_records",
});
