import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { useAccount } from "@/store/accountStore";
import React, { cloneElement } from "react";

export const useIsAssignedToProject = (projectId: number): boolean => {
  const { userManagementRole } = useAccount();

  if (!userManagementRole) return false;

  return userManagementRole.account_project_id === projectId;
};

interface HasPermissionProps {
  rolesNeeded: USER_MANAGEMENT_ROLE[];
}
export const useHasNeededRole = ({ rolesNeeded }: HasPermissionProps) => {
  const { userManagementRole } = useAccount();

  if (!userManagementRole) return false;

  return rolesNeeded.includes(userManagementRole.role_name);
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type PermissionsGateProps = Readonly<{
  children: React.ReactElement<any, any>;
  RenderError?: () => React.ReactElement<any, any>;
  errorProps?: any;
  rolesNeeded: USER_MANAGEMENT_ROLE[];
}>;
export function PermissionGate({
  children,
  RenderError,
  errorProps,
  rolesNeeded = [],
}: PermissionsGateProps): React.ReactElement<any, any> {
  const permissionGranted = useHasNeededRole({ rolesNeeded });

  if (!permissionGranted && !errorProps && RenderError) return <RenderError />;

  if (!permissionGranted && errorProps)
    return cloneElement(children, { ...errorProps });

  if (!permissionGranted) return <></>;

  return <>{children}</>;
}
/* eslint-enable */
