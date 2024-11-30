import { jwtDecode } from "jwt-decode";
import { AppConfig } from "./config";

export const stringToBoolean = (
  value: string | boolean,
): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

export const booleanToString = (value: boolean | string | unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value.toString();
  return "";
};

export const getUserRolesFromToken = (token?: string) => {
  if (!token) return [];
  const tokenData: any = jwtDecode(token);
  const appName = AppConfig.clientId;
  return tokenData?.resource_access?.[appName]?.roles || [];
};
