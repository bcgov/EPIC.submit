import { InternalStaffDocument, SubmissionItem } from "./SubmissionItem";
import { UpdateRequest } from "./UpdateRequest";
import { AccountProjectWork } from "./AccountProjectWork";

export enum SubmissionPackageType {
  MANAGEMENT_PLAN = "Management Plan",
  IEM = "IEM",
  IPD = "IPD",
  ADDITIONAL_INFORMATION = "Additional Information",
}

export enum SubmissionPackageApprovalType {
  A = "A",
  B = "B",
  C = "C",
}

export type PackageType = {
  id: number;
  name: SubmissionPackageType;
  title?: string;
  versioning_enabled: boolean;
  mandatory: boolean;
  approval_type?: SubmissionPackageApprovalType;
  success_message?: string;
};

// These statuses are just for UI purposes, the actual canonical business statuses are PackageStatus
export type NonCanonicalPackageStatus =
  | "REVISION_REQUIRED"
  | "UPDATED"
  | "NO_REVISION_REQUIRED"
  | "RESUBMITTED"
  | "UPDATE_REQUESTED"
  | "REVISION_REQUESTED";

export const NON_CANONICAL_PACKAGE_STATUS = Object.freeze<
  Record<NonCanonicalPackageStatus, NonCanonicalPackageStatus>
>({
  UPDATE_REQUESTED: "UPDATE_REQUESTED",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  UPDATED: "UPDATED",
  NO_REVISION_REQUIRED: "NO_REVISION_REQUIRED",
  RESUBMITTED: "RESUBMITTED",
});

export type PackageStatus =
  | "IN_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACCEPTED"
  | "SATISFIED"
  | "REJECTED"
  | "REVIEW_REJECTED"
  | "REVIEW_NOT_COMPLETED"
  | "REVIEWED"
  | "COMPLETED"
  | "SUBMITTED"
  | "PARTIALLY_COMPLETED"
  | "NEW_SUBMISSION"
  | "NEW"
  | "IN_PROGRESS"
  | "UNDER_CONSULTATION_CHECK"
  | "PASSED_CONSULTATION_CHECK"
  | "AWAITING_MANAGER_APPROVAL"
  | "FAILED_CONSULTATION_CHECK"
  | "CREATED"
  | "REQUESTED_BY_EAO"
  | "INTERNAL_VERIFICATION"
  | "VERIFIED"
  | "PENDING_ACKNOWLEDGEMENT"
  | "READY_FOR_ACKNOWLEDGEMENT"
  | "READY_FOR_APPROVAL"
  | "ACKNOWLEDGED"
  | "NOT_APPROVED"
  | "WITHDRAWN";

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
  REJECTED: {
    value: "REJECTED",
    label: "Rejected",
  },
  REVIEW_REJECTED: {
    value: "REVIEW_REJECTED",
    label: "Review Rejected",
  },
  REVIEW_NOT_COMPLETED: {
    value: "REVIEW_NOT_COMPLETED",
    label: "Review Not Completed",
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
  NEW: {
    value: "NEW",
    label: "New",
  },
  IN_PROGRESS: {
    value: "IN_PROGRESS",
    label: "In Progress",
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
  AWAITING_MANAGER_APPROVAL: {
    value: "AWAITING_MANAGER_APPROVAL",
    label: "Awaiting Manager Approval",
  },
  FAILED_CONSULTATION_CHECK: {
    value: "FAILED_CONSULTATION_CHECK",
    label: "Failed Consultation Check",
  },
  REVIEWED: {
    value: "REVIEWED",
    label: "Reviewed",
  },
  INTERNAL_VERIFICATION: {
    value: "INTERNAL_VERIFICATION",
    label: "Internal Verification",
  },
  VERIFIED: {
    value: "VERIFIED",
    label: "Verified",
  },
  REQUESTED_BY_EAO: {
    value: "REQUESTED_BY_EAO",
    label: "Requested by EAO",
  },
  PENDING_ACKNOWLEDGEMENT: {
    value: "PENDING_ACKNOWLEDGEMENT",
    label: "Pending Acknowledgement",
  },
  READY_FOR_ACKNOWLEDGEMENT: {
    value: "READY_FOR_ACKNOWLEDGEMENT",
    label: "Ready for Acknowledgement",
  },
  ACKNOWLEDGED: {
    value: "ACKNOWLEDGED",
    label: "Acknowledged",
  },
  READY_FOR_APPROVAL: {
    value: "READY_FOR_APPROVAL",
    label: "Ready for Approval",
  },
  NOT_APPROVED: {
    value: "NOT_APPROVED",
    label: "Not Approved",
  },
  WITHDRAWN: {
    value: "WITHDRAWN",
    label: "Withdrawn",
  },
};

export type SubmissionPackageMeta = Record<string, any>;

export type PackageVersion = {
  id: number;
  package_id: number;
  version: number;
  original_package_id: number;
  is_approved: boolean;
  is_enforceable: boolean;
  is_latest: boolean;
};

export type SubmissionPackage = {
  id: number;
  name: string;
  description?: string;
  status: PackageStatus[];
  submitted_on?: string;
  completed_on?: string;
  submitted_by?: string;
  type_id: number;
  type: PackageType;
  items: Array<SubmissionItem>;
  account_project_id: number;
  account_project_work?: AccountProjectWork;
  meta?: SubmissionPackageMeta;
  days_since_submission?: number;
  internal_staff_documents?: InternalStaffDocument[];
  review_status?: NonCanonicalPackageStatus;
  update_requests: Array<UpdateRequest>;
  all_update_requests: Array<UpdateRequest>;
  version: PackageVersion;
  enforceable?: boolean;
};
