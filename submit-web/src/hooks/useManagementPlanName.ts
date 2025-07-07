import { useMemo } from "react";
import { SubmissionPackage } from "@/models/Package";
import { SubmissionPackageType } from "@/components/Shared/types";

/**
 * Custom hook to generate the display name for a submission package
 * For Management Plan and IEM types, it prepends the condition number
 * For other types, it returns just the package name
 * Returns empty string if submissionPackage is null/undefined
 */
export const useManagementPlanName = (
  submissionPackage: SubmissionPackage | null | undefined
): string => {
  return useMemo(() => {
    if (!submissionPackage) {
      return "";
    }

    if (
      submissionPackage.type.name === SubmissionPackageType.MANAGEMENT_PLAN ||
      submissionPackage.type.name === SubmissionPackageType.IEM
    ) {
      return (
        submissionPackage.meta?.main_condition?.condition_number +
        " - " +
        submissionPackage.name
      );
    }
    return submissionPackage.name;
  }, [submissionPackage]);
};
