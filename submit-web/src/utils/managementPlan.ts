import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";

export const isProvidedPlan = (submissionPackage?: SubmissionPackage) =>
  submissionPackage?.type?.name === SubmissionPackageType.MANAGEMENT_PLAN &&
  submissionPackage.meta?.main_condition?.condition_attributes
    ?.submitted_to_eao_for === "N/A";
