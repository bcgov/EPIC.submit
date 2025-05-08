import * as yup from "yup";

export const IEM_DOCUMENT_FOLDERS = Object.freeze({
  IEM: "iem",
  SUPPORTING: "supporting",
});

export const iemSubmissionSchema = yup.object().shape({
  conditionSatisfied: yup.string().required("Please answer this question."),
  allRequirementsAddressed: yup
    .string()
    .required("Please answer this question."),
  informationAccurate: yup.string().required("Please answer this question."),
  iems: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
  supportingDocuments: yup.array().of(yup.string()),
  notes: yup.string(),
});

export type IemSubmissionForm = yup.InferType<typeof iemSubmissionSchema>;
