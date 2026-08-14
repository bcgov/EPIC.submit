import { useMemo } from "react";
import { Role } from "@/models/AccountUser";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

interface EffectiveRole {
  role_name: USER_MANAGEMENT_ROLE | "";
  original_package_ids: number[];
  project_ids: number[];
}

/**
 * Derives the effective UI role from an array of active user roles,
 * compared against the total number of projects in the account.
 *
 * @param roles - The user's active roles
 * @param totalAccountProjects - Total number of projects in the account (needed to
 *   distinguish "Project Admin (all)" from "Project Admin - Specific Projects")
 *
 * Logic:
 * - ACCOUNT_PRIMARY_ADMIN in any role → Regulated Party Account Administrator
 * - PROJECT_ADMIN assigned to ALL projects → Project Administrator
 * - PROJECT_ADMIN assigned to SOME projects → Project Administrator - Specific Projects
 * - SUBMISSION_ADMIN → Collaborator - All Submissions
 * - SPECIFIC_SUBMISSION_CONTRIBUTOR → Collaborator - Specific Submissions
 * - No roles → empty string
 */
export function useUserEffectiveRole(
  roles: Role[] | undefined,
  totalAccountProjects?: number,
): EffectiveRole {
  return useMemo(() => {
    if (!roles || roles.length === 0) {
      return { role_name: "", original_package_ids: [], project_ids: [] };
    }

    // Collect all original_package_ids and project_ids across roles
    const allOriginalPackageIds = roles.flatMap(
      (r) => r.original_package_ids || [],
    );
    const allProjectIds = roles
      .map((r) => r.account_project_id)
      .filter((id): id is number => id !== null);
    const uniqueProjectIds = [...new Set(allProjectIds)];

    // Check for Account Admin (highest priority)
    const hasAccountAdmin = roles.some(
      (r) => r.role_name === USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
    );
    if (hasAccountAdmin) {
      return {
        role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
        original_package_ids: allOriginalPackageIds,
        project_ids: uniqueProjectIds,
      };
    }

    // Check for Project Admin
    const projectAdminRoles = roles.filter(
      (r) => r.role_name === USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
    );
    if (projectAdminRoles.length > 0) {
      // Compare the number of projects the user is admin on vs total projects in account
      const assignedProjectCount = new Set(
        projectAdminRoles
          .map((r) => r.account_project_id)
          .filter((id): id is number => id !== null),
      ).size;

      // If we know the total and the user covers all of them → full Project Admin
      // If we don't know the total (undefined), fall back to checking if all roles are PROJECT_ADMIN
      const coversAllProjects =
        totalAccountProjects !== undefined && totalAccountProjects > 0
          ? assignedProjectCount >= totalAccountProjects
          : roles.every((r) => r.role_name === USER_MANAGEMENT_ROLE.PROJECT_ADMIN);

      if (coversAllProjects) {
        return {
          role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
          original_package_ids: allOriginalPackageIds,
          project_ids: uniqueProjectIds,
        };
      }
      return {
        role_name: USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN,
        original_package_ids: allOriginalPackageIds,
        project_ids: uniqueProjectIds,
      };
    }

    // Check for Submission Admin (Collaborator - All)
    const hasSubmissionAdmin = roles.some(
      (r) => r.role_name === USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
    );
    if (hasSubmissionAdmin) {
      return {
        role_name: USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
        original_package_ids: allOriginalPackageIds,
        project_ids: uniqueProjectIds,
      };
    }

    // Check for Specific Submission Contributor (Collaborator - Specific)
    const hasSpecificContributor = roles.some(
      (r) =>
        r.role_name === USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
    );
    if (hasSpecificContributor) {
      return {
        role_name: USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR,
        original_package_ids: allOriginalPackageIds,
        project_ids: uniqueProjectIds,
      };
    }

    // Fallback: use the first role's name
    return {
      role_name: roles[0].role_name || "",
      original_package_ids: allOriginalPackageIds,
      project_ids: uniqueProjectIds,
    };
  }, [roles, totalAccountProjects]);
}
