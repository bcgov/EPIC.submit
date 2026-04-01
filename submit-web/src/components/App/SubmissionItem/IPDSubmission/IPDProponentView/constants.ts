import * as yup from "yup";

export const ipdSubmissionSchema = yup.object().shape({
  ipd: yup.array().of(yup.string()),
  supportingIpd: yup.array().of(yup.string()),
});

export type IPDSubmissionForm = yup.InferType<typeof ipdSubmissionSchema>;

export const IPD_DOCUMENT_FOLDERS = Object.freeze({
  IPD: "ipd",
  SUPPORTING_IPD: "supporting_ipd",
});
