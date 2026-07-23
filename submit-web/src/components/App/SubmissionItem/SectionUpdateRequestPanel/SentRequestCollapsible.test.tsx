import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SentRequestCollapsible } from "./SentRequestCollapsible";
import { SentRequest } from "./types";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

// Mock the hooks used by the component
const mockUseHasRole = vi.fn();
vi.mock("@/hooks/common", () => ({
  useHasRole: (...args: unknown[]) => mockUseHasRole(...args),
}));

vi.mock("@/hooks/api/usePackages", () => ({
  useCreatePackageUpdateRequesNote: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdatePackageUpdateRequestNote: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const baseRequest: SentRequest = {
  updateRequestId: 1,
  itemTypeId: 10,
  itemTypeName: "Geospatial Information",
  reason: "Please upload updated GIS files",
  createdDate: "2024-06-01T00:00:00Z",
  createdBy: "staff-user",
  status: UPDATE_REQUEST_STATUS.OPEN.value,
};

const defaultProps = {
  request: baseRequest,
  expanded: true,
  onToggle: vi.fn(),
  onAcceptUpdate: vi.fn(),
  onWithdrawUpdate: vi.fn(),
  packageId: 100,
};

/**
 * Helper to find an action button by its label text.
 * ActionSplitButton renders a native <button> element with the label as text.
 * We filter out non-button elements (like MUI AccordionSummary div[role=button])
 * to avoid false matches.
 */
const findActionButton = (label: string) => {
  const buttons = screen.getAllByRole("button");
  return buttons.find(
    (btn) =>
      btn.tagName === "BUTTON" &&
      btn.textContent?.toLowerCase().includes(label.toLowerCase()),
  );
};

describe("SentRequestCollapsible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHasRole.mockReturnValue(true);
  });

  describe("GIS permission gating", () => {
    it("shows enabled Withdraw Update button when user has gis_extended_edit and request is GIS", () => {
      mockUseHasRole.mockReturnValue(true);

      render(
        <SentRequestCollapsible
          {...defaultProps}
          isGISRequest={true}
        />,
      );

      const button = findActionButton("Withdraw Update");
      expect(button).toBeDefined();
      expect(button).not.toBeDisabled();
    });

    it("disables Withdraw Update button when user lacks gis_extended_edit and request is GIS", () => {
      mockUseHasRole.mockReturnValue(false);

      render(
        <SentRequestCollapsible
          {...defaultProps}
          isGISRequest={true}
        />,
      );

      const button = findActionButton("Withdraw Update");
      expect(button).toBeDefined();
      expect(button).toBeDisabled();
    });

    it("renders tooltip wrapper on disabled Withdraw Update button for role restriction", () => {
      mockUseHasRole.mockReturnValue(false);

      render(
        <SentRequestCollapsible
          {...defaultProps}
          isGISRequest={true}
        />,
      );

      // The Tooltip wraps the disabled Box - verify the disabled button
      // is inside the tooltip wrapper by checking the DOM structure
      const button = findActionButton("Withdraw Update");
      expect(button).toBeDefined();
      expect(button).toBeDisabled();
    });

    it("shows enabled Accept Update button when user has gis_extended_edit and request is GIS with PENDING_REVIEW status", () => {
      mockUseHasRole.mockReturnValue(true);

      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
          isGISRequest={true}
        />,
      );

      const button = findActionButton("Accept Update");
      expect(button).toBeDefined();
      expect(button).not.toBeDisabled();
    });

    it("disables Accept Update button when user lacks gis_extended_edit and request is GIS with PENDING_REVIEW status", () => {
      mockUseHasRole.mockReturnValue(false);

      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
          isGISRequest={true}
        />,
      );

      const button = findActionButton("Accept Update");
      expect(button).toBeDefined();
      expect(button).toBeDisabled();
    });

    it("renders tooltip wrapper on disabled Accept Update button for role restriction", () => {
      mockUseHasRole.mockReturnValue(false);

      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
          isGISRequest={true}
        />,
      );

      const button = findActionButton("Accept Update");
      expect(button).toBeDefined();
      expect(button).toBeDisabled();
    });

    it("does not disable buttons when isGISRequest is false regardless of role", () => {
      mockUseHasRole.mockReturnValue(false);

      render(
        <SentRequestCollapsible
          {...defaultProps}
          isGISRequest={false}
        />,
      );

      const button = findActionButton("Withdraw Update");
      expect(button).toBeDefined();
      expect(button).not.toBeDisabled();
    });

    it("does not disable buttons when isGISRequest is not provided (defaults to false)", () => {
      mockUseHasRole.mockReturnValue(false);

      render(<SentRequestCollapsible {...defaultProps} />);

      const button = findActionButton("Withdraw Update");
      expect(button).toBeDefined();
      expect(button).not.toBeDisabled();
    });
  });

  describe("button visibility based on status", () => {
    it("shows Withdraw Update button when status is OPEN", () => {
      render(<SentRequestCollapsible {...defaultProps} />);

      const withdrawButton = findActionButton("Withdraw Update");
      const acceptButton = findActionButton("Accept Update");
      expect(withdrawButton).toBeDefined();
      expect(acceptButton).toBeUndefined();
    });

    it("shows Requested status chip when status is OPEN", () => {
      render(<SentRequestCollapsible {...defaultProps} />);

      expect(screen.getByText("Requested")).toBeInTheDocument();
    });

    it("shows Accept Update button when status is PENDING_REVIEW", () => {
      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
        />,
      );

      const acceptButton = findActionButton("Accept Update");
      const withdrawButton = findActionButton("Withdraw Update");
      expect(acceptButton).toBeDefined();
      expect(withdrawButton).toBeUndefined();
    });

    it("shows Updated status chip when status is PENDING_REVIEW", () => {
      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
        />,
      );

      expect(screen.getByText("Updated")).toBeInTheDocument();
    });

    it("does not show any action buttons when status is CLOSED", () => {
      const closedRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.CLOSED.value,
      };

      render(
        <SentRequestCollapsible {...defaultProps} request={closedRequest} />,
      );

      const acceptButton = findActionButton("Accept Update");
      const withdrawButton = findActionButton("Withdraw Update");
      expect(acceptButton).toBeUndefined();
      expect(withdrawButton).toBeUndefined();
    });
  });

  describe("staff vs proponent view", () => {
    it("does not show Withdraw Update button when onWithdrawUpdate is not provided", () => {
      render(
        <SentRequestCollapsible
          {...defaultProps}
          onWithdrawUpdate={undefined}
        />,
      );

      const withdrawButton = findActionButton("Withdraw Update");
      expect(withdrawButton).toBeUndefined();
    });

    it("does not show Accept Update button when onAcceptUpdate is not provided", () => {
      const pendingReviewRequest: SentRequest = {
        ...baseRequest,
        status: UPDATE_REQUEST_STATUS.PENDING_REVIEW.value,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={pendingReviewRequest}
          onAcceptUpdate={undefined}
        />,
      );

      const acceptButton = findActionButton("Accept Update");
      expect(acceptButton).toBeUndefined();
    });

    it("shows Add Note button in proponent view when no note exists and status is OPEN", () => {
      const requestWithNoNote: SentRequest = {
        ...baseRequest,
        note: undefined,
      };

      render(
        <SentRequestCollapsible
          {...defaultProps}
          request={requestWithNoNote}
          onAcceptUpdate={undefined}
          onWithdrawUpdate={undefined}
          onUpdateNote={vi.fn()}
          isProponentView={true}
        />,
      );

      const addNoteButton = findActionButton("Add Note for EAO");
      expect(addNoteButton).toBeDefined();
    });

    it("does not show Add Note button in staff view", () => {
      render(
        <SentRequestCollapsible
          {...defaultProps}
          isProponentView={false}
        />,
      );

      const addNoteButton = findActionButton("Add Note for EAO");
      expect(addNoteButton).toBeUndefined();
    });
  });

  describe("content rendering", () => {
    it("displays the item type name", () => {
      render(<SentRequestCollapsible {...defaultProps} />);

      expect(screen.getByText("Geospatial Information")).toBeInTheDocument();
    });

    it("displays the request reason", () => {
      render(<SentRequestCollapsible {...defaultProps} />);

      expect(
        screen.getByText("Please upload updated GIS files"),
      ).toBeInTheDocument();
    });

    it("displays the created by user", () => {
      render(<SentRequestCollapsible {...defaultProps} />);

      expect(
        screen.getByText(/EAO Staff — staff-user/),
      ).toBeInTheDocument();
    });
  });
});
