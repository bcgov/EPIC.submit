import { useMemo } from "react";
import { PACKAGE_STATUS, SubmissionPackage } from "@/models/Package";
import { AppConfig } from "@/utils/config";

interface SubmissionBannerStateInput {
  submissionPackage: SubmissionPackage | undefined;
  hasUpdatedItems: boolean;
  isSubmitDisabled: boolean;
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
  hasUpdatedItems,
  isSubmitDisabled,
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

    // Resolve the contact email based on package type
    const contactEmail = isWorkPackage
      ? submissionPackage.account_project_work?.work?.contact_email ||
        AppConfig.supportIpdEmail
      : AppConfig.supportMpEmail;

    // Terminal state checks
    const isApproved = status.includes(PACKAGE_STATUS.APPROVED.value);
    const isNotApproved = status.includes(PACKAGE_STATUS.NOT_APPROVED.value);
    const isWithdrawn = status.includes(PACKAGE_STATUS.WITHDRAWN.value);

    // Terminal banners take precedence
    const showApprovalBanner = isApproved;
    const showNotApprovedBanner = isNotApproved;

    // Revision required only if not in a terminal state
    const showRevisionRequiredBanner =
      isRevisionRequired && !isApproved && !isNotApproved;

    // Submission confirmation: shown when submitted, submit is disabled
    // (no pending doc changes), and no terminal/revision banners apply
    const showSubmissionConfirmation =
      Boolean(submissionPackage.submitted_on) &&
      isSubmitDisabled &&
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
  }, [submissionPackage, hasUpdatedItems, isSubmitDisabled, isRevisionRequired]);
}
