import { SubmissionItem } from "./SubmissionItem";
import { UpdateRequest } from "./UpdateRequest";

export type PackageType = {
  id: number;
  name: string;
};

// These statuses are just for UI purposes, the actual canonical business statuses are PackageStatus
export type NonCanonicalPackageStatus =
  | "PENDING_MANAGER_REVIEW"
  | "REVISION_REQUIRED"
  | "UPDATE_REQUESTED";
export const NON_CANONICAL_PACKAGE_STATUS = Object.freeze<
  Record<NonCanonicalPackageStatus, NonCanonicalPackageStatus>
>({
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
});

export type PackageStatus =
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REVIEW_REJECTED"
  | "COMPLETED"
  | "SUBMITTED"
  | "PARTIALLY_COMPLETED"
  | "NEW_SUBMISSION"
  | "UNDER_CONSULTATION_CHECK"
  | "PASSED_CONSULTATION_CHECK"
  | "CREATED"
  | "UPDATED";

export const PACKAGE_STATUS: Record<
  PackageStatus,
  { value: PackageStatus; label: string }
> = {
  IN_REVIEW: {
    value: "IN_REVIEW",
    label: "In Review",
  },
  UNDER_REVIEW: {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  APPROVED: {
    value: "APPROVED",
    label: "Approved",
  },
  REVIEW_REJECTED: {
    value: "REVIEW_REJECTED",
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
  UNDER_CONSULTATION_CHECK: {
    value: "UNDER_CONSULTATION_CHECK",
    label: "Under Consultation Check",
  },
  PASSED_CONSULTATION_CHECK: {
    value: "PASSED_CONSULTATION_CHECK",
    label: "Passed Consultation Check",
  },
  UPDATED: {
    value: "UPDATED",
    label: "Updated",
  },
  CREATED: {
    value: "CREATED",
    label: "Created",
  },
};

export type SubmissionPackageMeta = Record<string, number | string>;

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
  meta?: SubmissionPackageMeta;
  days_since_submission?: number;
  review_status?: NonCanonicalPackageStatus;
  update_requests: Array<UpdateRequest>;
};

export type PackageVersion = {
  id: number;
  package_id: number;
  version: string;
  original_package_id: number;
};
