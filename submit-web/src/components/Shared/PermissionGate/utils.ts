import { EPIC_SUBMIT_ROLE } from "@/models/Role";

export const checkIfEAO = (roles: string[]) => {
  if (!roles) {
    return false;
  }
  return roles.length > 0;
};
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

export const checkIfProponent = (roles?: string[]) => {
  if (!roles) {
    return true;
  }
};

export const hasPermission = ({
  permissions,
  scopes,
}: {
  permissions: string[];
  scopes: string[];
}) => {
  const scopesMap = scopes.reduce(
    (acc, scope) => {
      acc[scope] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  return permissions.some((permission) => scopesMap[permission]);
};
