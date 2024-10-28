import { SubmissionItem } from "./SubmissionItem";

export type PackageType = {
  id: number;
  name: string;
};

export type PackageStatus =
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "SUBMITTED"
  | "PARTIALLY_COMPLETED"
  | "NEW_SUBMISSION";

export const PACKAGE_STATUS: Record<
  PackageStatus,
  { value: PackageStatus; label: string }
> = {
  IN_REVIEW: {
    value: "IN_REVIEW",
    label: "In Review",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  REJECTED: {
    value: "REJECTED",
    label: "Rejected",
  },
  COMPLETED: {
    value: "COMPLETED",
    label: "Completed",
  },
  SUBMITTED: {
    value: "SUBMITTED",
    label: "Submitted",
  },
  PARTIALLY_COMPLETED: {
    value: "PARTIALLY_COMPLETED",
    label: "Partially Completed",
  },
  NEW_SUBMISSION: {
    value: "NEW_SUBMISSION",
    label: "New Submission",
  },
};

export type SubmissionPackage = {
  id: number;
  name: string;
  status: PackageStatus[];
  submitted_on?: string;
  submitted_by?: string;
  type_id: number;
  type: PackageType;
  items: Array<SubmissionItem>;
  account_project_id: number;
};
