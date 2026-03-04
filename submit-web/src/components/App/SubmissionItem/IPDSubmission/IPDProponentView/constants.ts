import * as yup from "yup";

export const ipdSubmissionSchema = yup.object().shape({
  ipd: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
  supportingIpd: yup.array().of(yup.string()),
});

export type IPDSubmissionForm = yup.InferType<typeof ipdSubmissionSchema>;

export const IPD_DOCUMENT_FOLDERS = Object.freeze({
  IPD: "ipd",
  SUPPORTING_IPD: "supporting_ipd",
});
