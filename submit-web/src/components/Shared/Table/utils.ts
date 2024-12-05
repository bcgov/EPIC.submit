import { downloadObject } from "@/hooks/api/useObjectStorage";
import { hasPermission } from "../PermissionGate";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

export type Order = "asc" | "desc";

export function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function tableSort<T, Key extends keyof T>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: number | string | string[] },
  b: { [key in Key]: number | string | string[] },
) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export const getObjectFromS3 = async ({
  name,
  url,
}: {
  name: string;
  url: string;
}) => {
  const response = await downloadObject({
    filename: name,
    s3sourceuri: url,
  });
  const linkUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = linkUrl;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
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
