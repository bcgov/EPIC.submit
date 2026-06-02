import { NonCanonicalPackageStatus, PackageStatus } from "@/models/Package";
import { StatusChip, StatusChipTheme } from "@/components/Shared/StatusChip";

// Map statuses to labels and themes
type StyleProps = {
  label: string;
  theme: StatusChipTheme;
};

const statusMap: Record<PackageStatus | NonCanonicalPackageStatus, StyleProps> =
  {
    APPROVED: { label: "Approved", theme: "success" },
    ACCEPTED: { label: "Accepted", theme: "success" },
    SATISFIED: { label: "Satisfied", theme: "success" },
    REVIEWED: { label: "Reviewed", theme: "success" },
    COMPLETED: { label: "Completed", theme: "success" },
    PASSED_CONSULTATION_CHECK: {
      label: "Passed Consultation Check",
      theme: "success",
    },
    NO_REVISION_REQUIRED: {
      label: "No Revision Required",
      theme: "success",
    },
    VERIFIED: { label: "Verified", theme: "success" },
    ACKNOWLEDGED: { label: "Acknowledged", theme: "success" },

    IN_PROGRESS: { label: "In Progress", theme: "info" },
    IN_REVIEW: { label: "In Review", theme: "info" },
    UNDER_REVIEW: { label: "Under Review", theme: "info" },
    UNDER_CONSULTATION_CHECK: {
      label: "Under Consultation Check",
      theme: "info",
    },
    SUBMITTED: { label: "Submitted", theme: "info" },
    RESUBMITTED: { label: "Resubmitted", theme: "info" },

    REVIEW_REJECTED: {
      label: "Review Rejected",
      theme: "danger",
    },
    REJECTED: {
      label: "Rejected",
      theme: "danger",
    },
    FAILED_CONSULTATION_CHECK: {
      label: "Failed Consultation Check",
      theme: "danger",
    },
    NOT_APPROVED: { label: "Not Approved", theme: "danger" },

    REVIEW_NOT_COMPLETED: {
      label: "Review Not Completed",
      theme: "warning",
    },
    PARTIALLY_COMPLETED: { label: "Partially Completed", theme: "warning" },
    REQUESTED_BY_EAO: {
      label: "Requested by EAO",
      theme: "warning",
    },
    INTERNAL_VERIFICATION: { label: "Internal Verification", theme: "warning" },

    NEW: { label: "New", theme: "decision" },
    NEW_SUBMISSION: { label: "New Submission", theme: "purple" },

    AWAITING_MANAGER_APPROVAL: {
      label: "Awaiting Manager Approval",
      theme: "orange",
    },
    UPDATE_REQUESTED: {
      label: "Update Requested",
      theme: "orange",
    },
    REVISION_REQUIRED: {
      label: "Revision Required",
      theme: "orange",
    },
    REVISION_REQUESTED: {
      label: "Revision Requested",
      theme: "orange",
    },

    UPDATED: { label: "Updated", theme: "purple" },
    PENDING_ACKNOWLEDGEMENT: {
      label: "Pending Acknowledgement",
      theme: "purple",
    },
    READY_FOR_ACKNOWLEDGEMENT: {
      label: "Ready for Acknowledgement",
      theme: "purple",
    },
    READY_FOR_APPROVAL: { label: "Ready for Approval", theme: "purple" },

    CREATED: { label: "Created", theme: "neutral" },
  };

type PackageStatusChipProps = Readonly<{
  status: PackageStatus | NonCanonicalPackageStatus;
}>;

export default function PackageStatusChip({ status }: PackageStatusChipProps) {
  const config = statusMap[status];

  if (!config || !config.label) {
    return null;
  }

  return <StatusChip label={config.label} theme={config.theme} />;
}
