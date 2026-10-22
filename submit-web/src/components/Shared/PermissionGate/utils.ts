import { EPIC_SUBMIT_ROLE, USER_MANAGEMENT_ROLE } from "@/models/Role";
import { Role } from "@/models/AccountUser";

// Management roles that can see the read-only Reports & Recurring Submissions
// section. Collaborator - Specific Submissions is intentionally excluded.
const REPORTS_SECTION_ROLES: USER_MANAGEMENT_ROLE[] = [
  USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
  USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
  USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
];

/**
 * Whether the user may view the Reports & Recurring Submissions section.
 * True for Account/Project Administrators and Collaborator - All Submissions;
 * false for Collaborator - Specific Submissions.
 */
export const canViewReportsSection = (
  userManagementRoles?: Role[],
): boolean => {
  if (!userManagementRoles?.length) {
    return false;
  }
  return userManagementRoles.some((role) =>
    REPORTS_SECTION_ROLES.includes(role.role_name),
  );
};

export const checkIfManager = (roles?: string[]) => {
  if (!roles) {
    return false;
  }
  return hasPermission({
    permissions: roles || [],
    scopes: [EPIC_SUBMIT_ROLE.mp_extended_edit],
  });
};

export const checkIfStaff = (roles?: string[]) => {
  if (!roles) {
    return false;
  }
  return (
    !checkIfManager(roles) &&
    hasPermission({
      permissions: roles,
      scopes: [EPIC_SUBMIT_ROLE.eao_view],
    })
  );
};

export const checkIfMPT = (roles?: string[]) => {
  if (!roles) {
    return false;
  }
  return hasPermission({
    permissions: roles,
    scopes: [EPIC_SUBMIT_ROLE.mp_view],
  });
};

export const checkIfGISUser = (roles?: string[]) => {
  if (!roles) {
    return false;
  }
  return hasPermission({
    permissions: roles || [],
    scopes: [EPIC_SUBMIT_ROLE.gis_extended_edit],
  });
};

export const hasPermission = ({
  permissions,
  scopes,
}: {
  permissions: string[];
  scopes: string[];
}) => {
  // Always include full_access role in the scopes check
  const scopesWithFullAccess = [...scopes, EPIC_SUBMIT_ROLE.full_access];
  
  const scopesMap = scopesWithFullAccess.reduce(
    (acc, scope) => {
      acc[scope] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  return permissions.some((permission) => scopesMap[permission]);
};
