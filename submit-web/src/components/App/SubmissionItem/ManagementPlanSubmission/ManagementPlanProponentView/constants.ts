import * as yup from "yup";

export const managementPlanSubmissionSchema = yup.object().shape({
  conditionSatisfied: yup.string().required("Please answer this question."),
  allRequirementsAddressed: yup
    .string()
    .required("Please answer this question."),
  informationAccurate: yup.string().required("Please answer this question."),
  managementPlans: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
  supportingDocuments: yup.array().of(yup.string()),
  notes: yup
    .string()
    .optional()
    .max(2500, "Notes must be less than 2500 characters."),
});

export type ManagementPlanSubmissionForm = yup.InferType<
  typeof managementPlanSubmissionSchema
>;

export const MANAGEMENT_PLAN_DOCUMENT_FOLDERS = Object.freeze({
  MANAGEMENT_PLAN: "management_plan",
  SUPPORTING: "supporting",
});
