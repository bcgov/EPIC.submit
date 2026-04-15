import { useMemo } from "react";
import { SubmissionPackage } from "@/models/Package";
import { SubmissionPackageType } from "@/models/Package";

/**
 * Custom hook to generate the display name for a submission package
 * For Management Plan and IEM types, it prepends the condition number
 * For other types, it returns just the package name
 * Returns empty string if submissionPackage is null/undefined
 */
export const useManagementPlanName = (
  submissionPackage: SubmissionPackage | null | undefined,
): string => {
  return useMemo(() => {
    if (!submissionPackage) {
      return "";
    }

    const conditionNumber =
      submissionPackage?.meta?.main_condition?.condition_number;

    const needsConditionNumber =
      submissionPackage.type.name === SubmissionPackageType.MANAGEMENT_PLAN ||
      submissionPackage.type.name === SubmissionPackageType.IEM;

    if (needsConditionNumber && conditionNumber) {
      return conditionNumber + " - " + submissionPackage.name;
    }
    if (submissionPackage.type.name === SubmissionPackageType.ADDITIONAL_INFORMATION) {
      return `${submissionPackage.type.title} - ${submissionPackage.name}`;
    }
    return submissionPackage.name;
  }, [submissionPackage]);
};
