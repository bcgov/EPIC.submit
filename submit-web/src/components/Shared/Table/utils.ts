import { downloadObject, S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { camelCase } from "lodash";

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
  const linkUrl = window.URL.createObjectURL(new Blob([response]));
  const link = document.createElement("a");
  link.href = linkUrl;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
};

export const getSubmissionFolderName = ({
  projectName,
  sectionName,
}: {
  projectName: string;
  sectionName: string;
}) => {
  const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9]/g, "");
  return `${S3_FOLDER.SUBMISSIONS.value}/${camelCase(sanitizedProjectName)}/${sectionName}/`;
};
