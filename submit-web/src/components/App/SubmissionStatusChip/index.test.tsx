import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmissionStatusChipStack } from "./index";
import { SUBMISSION_ITEM_STATUS } from "@/models/Submission";
import { PACKAGE_STATUS } from "@/models/Package";

// ── Module mocks ────────────────────────────────────────────────────────────

const mockUseAccount = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: () => mockUseAccount(),
}));

// Render the underlying chip as a lightweight testable element so the stack's
// visibility logic is what is under test (not the chip's own rendering).
vi.mock("@/components/Shared/StatusChip", () => ({
  StatusChip: ({ label }: { label: string }) => (
    <span data-testid={`chip-${label}`}>{label}</span>
  ),
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe("SubmissionStatusChipStack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SUBMITTED badge is hidden", () => {
    it("does not render the Submitted chip for a proponent even when the package is submitted", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.SUBMITTED.value}
          packageStatus={[PACKAGE_STATUS.SUBMITTED.value]}
        />,
      );

      expect(screen.queryByTestId("chip-Submitted")).not.toBeInTheDocument();
    });

    it("does not render the Submitted chip for a proponent when the package is not submitted", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.SUBMITTED.value}
          packageStatus={[]}
        />,
      );

      expect(screen.queryByTestId("chip-Submitted")).not.toBeInTheDocument();
    });

    it("does not render the Submitted chip for staff", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.SUBMITTED.value}
        />,
      );

      expect(screen.queryByTestId("chip-Submitted")).not.toBeInTheDocument();
    });
  });

  describe("other statuses still render", () => {
    it("renders a non-submitted status chip for a proponent", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.APPROVED.value}
        />,
      );

      expect(screen.getByTestId("chip-Approved")).toBeInTheDocument();
    });

    it("renders a non-submitted status chip for staff", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.UNDER_REVIEW.value}
        />,
      );

      expect(screen.getByTestId("chip-Under Review")).toBeInTheDocument();
    });

    it("still renders the Flagged for Update chip alongside a hidden Submitted status", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.SUBMITTED.value}
          isFlaggedForUpdate
        />,
      );

      expect(screen.queryByTestId("chip-Submitted")).not.toBeInTheDocument();
      expect(screen.getByTestId("chip-Flagged for Update")).toBeInTheDocument();
    });
  });

  describe("showOnlyUpdateChips", () => {
    it("hides the base status chip when showOnlyUpdateChips is true", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });

      render(
        <SubmissionStatusChipStack
          status={SUBMISSION_ITEM_STATUS.APPROVED.value}
          showOnlyUpdateChips
        />,
      );

      expect(screen.queryByTestId("chip-Approved")).not.toBeInTheDocument();
    });
  });
});
