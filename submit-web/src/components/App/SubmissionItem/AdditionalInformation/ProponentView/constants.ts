import * as yup from "yup";

export const additionalInformationSchema = yup.object().shape({
  uploadDocuments: yup.array().of(yup.string()),
});

export type AdditionalInformationForm = yup.InferType<typeof additionalInformationSchema>;

export const ADDITIONAL_INFORMATION_DOCUMENT_FOLDERS = Object.freeze({
  UPLOAD_DOCUMENTS: "upload_documents",
});
