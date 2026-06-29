import { EPIC_SUBMIT_ROLE } from "@/models/Role";

export const checkIfManager = (roles?: string[]) => {
  if (!roles) {
    return false;
  }
  return hasPermission({
    permissions: roles || [],
    scopes: [EPIC_SUBMIT_ROLE.extended_eao_edit],
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
