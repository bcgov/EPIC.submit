import { useMemo } from "react";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { SubmissionPackage, PackageType } from "@/models/Package";

/**
 * Hook to determine the correct package-specific roles based on package type.
 * Returns the appropriate MP_* or W_* roles for the given package.
 */
export const usePackageRoles = (
  submissionPackage?: SubmissionPackage,
  packageType?: PackageType
) => {
  const actualPackageType = packageType || submissionPackage?.type;

  return useMemo(() => {
    // Determine if this is a work package or MP-type package
    const isWorkPackage = submissionPackage?.account_project_work != null;
    
    // MP-type packages: Management Plan, IEM
    const isMPPackage = 
      actualPackageType?.name === "Management Plan" ||
      actualPackageType?.name === "IEM";

    if (isWorkPackage) {
      // Work package roles
      return {
        view: EPIC_SUBMIT_ROLE.w_view,
        edit: EPIC_SUBMIT_ROLE.w_edit,
        create: EPIC_SUBMIT_ROLE.w_create,
        approve: EPIC_SUBMIT_ROLE.w_extended_edit,
      };
    } else if (isMPPackage) {
      // Management Plan package roles
      return {
        view: EPIC_SUBMIT_ROLE.mp_view,
        edit: EPIC_SUBMIT_ROLE.mp_edit,
        create: EPIC_SUBMIT_ROLE.mp_create,
        approve: EPIC_SUBMIT_ROLE.mp_extended_edit,
      };
    } else {
      // Fallback to EAO roles for other package types (backward compatibility)
      return {
        view: EPIC_SUBMIT_ROLE.eao_view,
        edit: EPIC_SUBMIT_ROLE.eao_edit,
        create: EPIC_SUBMIT_ROLE.eao_create,
        approve: EPIC_SUBMIT_ROLE.eao_edit, // No EAO approve role
      };
    }
  }, [submissionPackage?.account_project_work, actualPackageType?.name]);
};
