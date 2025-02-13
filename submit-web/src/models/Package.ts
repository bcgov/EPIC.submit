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
  | "UPDATED"
  | "UPDATE_REQUESTED";
export const NON_CANONICAL_PACKAGE_STATUS = Object.freeze<
  Record<NonCanonicalPackageStatus, NonCanonicalPackageStatus>
>({
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  UPDATED: "UPDATED",
});

export type PackageStatus =
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACCEPTED"
  | "SATISFIED"
  | "REVIEW_REJECTED"
  | "COMPLETED"
  | "SUBMITTED"
  | "PARTIALLY_COMPLETED"
  | "NEW_SUBMISSION"
  | "UNDER_CONSULTATION_CHECK"
  | "PASSED_CONSULTATION_CHECK"
  | "CREATED";

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
  CREATED: {
    value: "CREATED",
    label: "Created",
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
  },
  SATISFIED: {
    value: "SATISFIED",
    label: "Satisfied",
  },
};

export type SubmissionPackageMeta = Record<string, any>;

export type PackageVersion = {
  id: number;
  package_id: number;
  version: number;
  original_package_id: number;
};

export type SubmissionPackage = {
  id: number;
  name: string;
  status: PackageStatus[];
  submitted_on?: string;
  completed_on?: string;
  submitted_by?: string;
  type_id: number;
  type: PackageType;
  items: Array<SubmissionItem>;
  account_project_id: number;
  meta?: SubmissionPackageMeta;
  days_since_submission?: number;
  review_status?: NonCanonicalPackageStatus;
  update_requests: Array<UpdateRequest>;
  version: PackageVersion;
};
