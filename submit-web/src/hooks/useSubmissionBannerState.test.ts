import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSubmissionBannerState } from "./useSubmissionBannerState";
import { SubmissionPackage } from "@/models/Package";

vi.mock("@/utils/config", () => ({
  AppConfig: {
    supportMpEmail: "EAO.ManagementPlanSupport@gov.bc.ca",
    supportIpdEmail: "EAO.emailaddress@gov.bc.ca",
  },
}));

const basePackage: SubmissionPackage = {
  id: 1,
  name: "Test Package",
  status: ["SUBMITTED"],
  submitted_on: "2026-01-01T00:00:00Z",
  type_id: 1,
  type: {
    id: 1,
    name: "Management Plan" as any,
    versioning_enabled: true,
    mandatory: false,
    success_message: "Your plan has been submitted.",
  },
  items: [],
  account_project_id: 1,
  update_requests: [],
  all_update_requests: [],
  version: { id: 1, package_id: 1, version: 1, original_package_id: 1, is_approved: false, is_latest: true },
};

describe("useSubmissionBannerState", () => {
  it("returns showSubmissionConfirmation true when submitted and no updated items", () => {
    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: basePackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.showSubmissionConfirmation).toBe(true);
    expect(result.current.showApprovalBanner).toBe(false);
    expect(result.current.showNotApprovedBanner).toBe(false);
    expect(result.current.showRevisionRequiredBanner).toBe(false);
  });

  it("returns showSubmissionConfirmation false when hasUpdatedItems is true", () => {
    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: basePackage,
        hasUpdatedItems: true,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.showSubmissionConfirmation).toBe(false);
  });

  it("returns showApprovalBanner true when status includes APPROVED", () => {
    const approvedPackage: SubmissionPackage = {
      ...basePackage,
      status: ["APPROVED"],
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: approvedPackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.showApprovalBanner).toBe(true);
    expect(result.current.showSubmissionConfirmation).toBe(false);
  });

  it("returns showNotApprovedBanner true when status includes NOT_APPROVED", () => {
    const notApprovedPackage: SubmissionPackage = {
      ...basePackage,
      status: ["NOT_APPROVED"],
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: notApprovedPackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.showNotApprovedBanner).toBe(true);
    expect(result.current.showSubmissionConfirmation).toBe(false);
  });

  it("returns showRevisionRequiredBanner true when isRevisionRequired and not terminal", () => {
    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: basePackage,
        hasUpdatedItems: false,
        isRevisionRequired: true,
      }),
    );

    expect(result.current.showRevisionRequiredBanner).toBe(true);
    expect(result.current.showSubmissionConfirmation).toBe(false);
  });

  it("returns showRevisionRequiredBanner false when approved (terminal takes precedence)", () => {
    const approvedPackage: SubmissionPackage = {
      ...basePackage,
      status: ["APPROVED"],
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: approvedPackage,
        hasUpdatedItems: false,
        isRevisionRequired: true,
      }),
    );

    expect(result.current.showRevisionRequiredBanner).toBe(false);
    expect(result.current.showApprovalBanner).toBe(true);
  });

  it("returns showSubmissionConfirmation false when package is withdrawn", () => {
    const withdrawnPackage: SubmissionPackage = {
      ...basePackage,
      status: ["WITHDRAWN"],
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: withdrawnPackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.showSubmissionConfirmation).toBe(false);
  });

  it("returns IPD email from account_project_work.work.contact_email when available", () => {
    const workPackage: SubmissionPackage = {
      ...basePackage,
      account_project_work: {
        id: 1,
        work_id: 10,
        work: {
          id: 10,
          project_id: 5,
          contact_email: "custom.eao@gov.bc.ca",
        },
      },
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: workPackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.contactEmail).toBe("custom.eao@gov.bc.ca");
  });

  it("returns IPD fallback email when contact_email is null", () => {
    const workPackage: SubmissionPackage = {
      ...basePackage,
      account_project_work: {
        id: 1,
        work_id: 10,
        work: {
          id: 10,
          project_id: 5,
        },
      },
    };

    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: workPackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.contactEmail).toBe("EAO.emailaddress@gov.bc.ca");
  });

  it("returns MP email for non-work packages", () => {
    const { result } = renderHook(() =>
      useSubmissionBannerState({
        submissionPackage: basePackage,
        hasUpdatedItems: false,
        isRevisionRequired: false,
      }),
    );

    expect(result.current.contactEmail).toBe(
      "EAO.ManagementPlanSupport@gov.bc.ca",
    );
  });
});
