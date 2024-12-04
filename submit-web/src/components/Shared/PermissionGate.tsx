import React, { cloneElement } from "react";
import { useAccount } from "@/store/accountStore";

export type PermissionsGateProps = {
  children: React.ReactElement;
  RenderError?: React.ComponentType;
  errorProps?: Record<string, any>;
  scopes: string[];
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

export default function PermissionsGate({
  children,
  RenderError = () => <></>,
  scopes = [],
  errorProps,
}: PermissionsGateProps) {
  const { roles } = useAccount();

  const permissions = roles || [];

  const permissionGranted = hasPermission({ permissions, scopes });

  if (!permissionGranted && !errorProps) return <RenderError />;

  if (!permissionGranted && errorProps)
    return cloneElement(children, { ...errorProps });

  return <>{children}</>;
}
