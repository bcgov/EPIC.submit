import { useMemo } from "react";
import { PACKAGE_STATUS, PackageVersion, SubmissionPackage } from "@/models/Package";
import { AppConfig } from "@/utils/config";

interface SubmissionBannerStateInput {
  submissionPackage: SubmissionPackage | undefined;
  packageVersions?: PackageVersion[];
  hasUpdatedItems: boolean;
  isRevisionRequired: boolean;
}

interface SubmissionBannerState {
  showSubmissionConfirmation: boolean;
  showApprovalBanner: boolean;
  showNotApprovedBanner: boolean;
  showRevisionRequiredBanner: boolean;
  contactEmail: string;
}

export function useSubmissionBannerState({
  submissionPackage,
  packageVersions,
  hasUpdatedItems,
  isRevisionRequired,
}: SubmissionBannerStateInput): SubmissionBannerState {
  return useMemo(() => {
    if (!submissionPackage) {
      return {
        showSubmissionConfirmation: false,
        showApprovalBanner: false,
        showNotApprovedBanner: false,
        showRevisionRequiredBanner: false,
        contactEmail: AppConfig.supportMpEmail,
      };
    }

    const status = submissionPackage.status;
    const isWorkPackage = Boolean(submissionPackage.account_project_work);
    const version = packageVersions?.find(
      (v) => v.package_id === submissionPackage.id
    );
  
    // Resolve the contact email based on package type
    const contactEmail = isWorkPackage
      ? submissionPackage.account_project_work?.work?.contact_email ||
        AppConfig.supportIpdEmail
      : AppConfig.supportMpEmail;

    // Terminal state checks
    const isLatest = version ? version.is_latest : true;
    const isApproved = status.includes(PACKAGE_STATUS.APPROVED.value);
    const isNotApproved = status.includes(PACKAGE_STATUS.NOT_APPROVED.value);
    const isWithdrawn = status.includes(PACKAGE_STATUS.WITHDRAWN.value);

    // Terminal banners take precedence
    const showNotApprovedBanner = isNotApproved;

    // Approval banner shows on previous versions that are neither NotApproved nor Withdrawn
    const showApprovalBanner = !showNotApprovedBanner && !isWithdrawn && (!isLatest || isApproved);

    // Revision required only if not in a terminal state
    const showRevisionRequiredBanner =
      isRevisionRequired && !showApprovalBanner;

    // Submission confirmation: shown when submitted, no pending doc changes,
    // and no terminal/revision banners apply
    const showSubmissionConfirmation =
      Boolean(submissionPackage.submitted_on) &&
      !hasUpdatedItems &&
      !showApprovalBanner &&
      !showNotApprovedBanner &&
      !showRevisionRequiredBanner &&
      !isWithdrawn;

    return {
      showSubmissionConfirmation,
      showApprovalBanner,
      showNotApprovedBanner,
      showRevisionRequiredBanner,
      contactEmail,
    };
  }, [submissionPackage, packageVersions, hasUpdatedItems, isRevisionRequired]);
}
