import { useAccount } from "@/store/accountStore";
import { cloneElement } from "react";
import { hasPermission } from "./utils";

type PermissionsGateProps = {
  children: React.ReactElement;
  RenderError?: React.ComponentType;
  errorProps?: Record<string, unknown>;
  scopes: string[];
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
