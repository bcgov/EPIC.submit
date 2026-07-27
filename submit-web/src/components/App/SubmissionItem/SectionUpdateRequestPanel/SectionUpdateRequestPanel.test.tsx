import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SectionUpdateRequestPanel } from "./index";
import { PendingRequest, SentRequest, PreviousRequest } from "./types";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

// Mock child components to isolate SectionUpdateRequestPanel logic
vi.mock("./SentRequestCollapsible", () => ({
  SentRequestCollapsible: (props: {
    request: SentRequest;
    isGISRequest?: boolean;
    onAcceptUpdate?: (id: number) => void;
    onWithdrawUpdate?: (id: number) => void;
    isProponentView?: boolean;
  }) => (
    <div data-testid={`sent-request-${props.request.updateRequestId}`}>
      <span data-testid="item-type-name">{props.request.itemTypeName}</span>
      <span data-testid="is-gis-request">{String(props.isGISRequest)}</span>
      <span data-testid="is-proponent-view">{String(props.isProponentView)}</span>
      {props.onAcceptUpdate && <span data-testid="has-accept-handler">true</span>}
      {props.onWithdrawUpdate && <span data-testid="has-withdraw-handler">true</span>}
    </div>
  ),
}));

vi.mock("./PendingRequestCollapsible", () => ({
  PendingRequestCollapsible: (props: {
    request: PendingRequest;
    hasError?: boolean;
  }) => (
    <div data-testid={`pending-request-${props.request.itemTypeId}`}>
      <span data-testid="has-error">{String(props.hasError)}</span>
      <span>{props.request.itemTypeName}</span>
    </div>
  ),
}));

vi.mock("./PreviousRequestCollapsible", () => ({
  PreviousRequestCollapsible: (props: {
    request: PreviousRequest;
  }) => (
    <div data-testid={`previous-request-${props.request.updateRequestId}`}>
      <span>{props.request.itemTypeName}</span>
    </div>
  ),
}));

vi.mock("@/hooks/common", () => ({
  useHasRole: () => true,
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

const makeSentRequest = (overrides: Partial<SentRequest> = {}): SentRequest => ({
  updateRequestId: 1,
  itemTypeId: 10,
  itemTypeName: "Initial Project Description",
  reason: "Please update this section",
  createdDate: "2024-06-01T00:00:00Z",
  createdBy: "staff-user",
  status: UPDATE_REQUEST_STATUS.OPEN.value,
  ...overrides,
});

const makePendingRequest = (overrides: Partial<PendingRequest> = {}): PendingRequest => ({
  itemTypeId: 20,
  itemTypeName: "Engagement Plan",
  reason: "Needs more detail",
  ...overrides,
});

const makePreviousRequest = (overrides: Partial<PreviousRequest> = {}): PreviousRequest => ({
  updateRequestId: 100,
  itemTypeId: 30,
  itemTypeName: "Initial Project Description",
  reason: "Old request reason",
  createdDate: "2024-01-01T00:00:00Z",
  createdBy: "old-staff",
  status: UPDATE_REQUEST_STATUS.ACCEPTED.value,
  ...overrides,
});

const defaultProps = {
  pendingRequests: [] as PendingRequest[],
  sentRequests: [] as SentRequest[],
  previousRequests: [] as PreviousRequest[],
  onRemoveFlag: vi.fn(),
  onSendRequests: vi.fn(),
  onUpdateNote: vi.fn(),
  onAcceptUpdate: vi.fn(),
  onWithdrawUpdate: vi.fn(),
  isLoading: false,
  packageId: 100,
};

describe("SectionUpdateRequestPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("panel visibility", () => {
    it("renders nothing when there are no requests of any kind", () => {
      const { container } = render(<SectionUpdateRequestPanel {...defaultProps} />);

      expect(container.firstChild).toBeNull();
    });

    it("renders panel when there are sent requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
        />,
      );

      expect(screen.getByText("Update Requests")).toBeInTheDocument();
    });

    it("renders panel when there are pending requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest()]}
        />,
      );

      expect(screen.getByText("Update Requests")).toBeInTheDocument();
    });

    it("renders panel when there are only previous requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          previousRequests={[makePreviousRequest()]}
        />,
      );

      expect(screen.getByText("Update Requests")).toBeInTheDocument();
    });

    it("shows empty state message when only previous requests exist", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          previousRequests={[makePreviousRequest()]}
        />,
      );

      expect(
        screen.getByText("No sections have been flagged for update."),
      ).toBeInTheDocument();
    });
  });

  describe("isGISRequest prop derivation", () => {
    it("passes isGISRequest=true for Geospatial Information item type", () => {
      const gisRequest = makeSentRequest({
        itemTypeName: "Geospatial Information",
      });

      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[gisRequest]}
        />,
      );

      const isGISFlag = screen.getByTestId("is-gis-request");
      expect(isGISFlag).toHaveTextContent("true");
    });

    it("passes isGISRequest=false for non-GIS item types", () => {
      const nonGisRequest = makeSentRequest({
        itemTypeName: "Initial Project Description",
      });

      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[nonGisRequest]}
        />,
      );

      const isGISFlag = screen.getByTestId("is-gis-request");
      expect(isGISFlag).toHaveTextContent("false");
    });

    it("correctly identifies GIS and non-GIS requests in a mixed list", () => {
      const gisRequest = makeSentRequest({
        updateRequestId: 1,
        itemTypeName: "Geospatial Information",
      });
      const nonGisRequest = makeSentRequest({
        updateRequestId: 2,
        itemTypeName: "Engagement Plan",
      });

      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[gisRequest, nonGisRequest]}
        />,
      );

      const sentRequest1 = screen.getByTestId("sent-request-1");
      const sentRequest2 = screen.getByTestId("sent-request-2");

      expect(sentRequest1.querySelector('[data-testid="is-gis-request"]')).toHaveTextContent("true");
      expect(sentRequest2.querySelector('[data-testid="is-gis-request"]')).toHaveTextContent("false");
    });
  });

  describe("proponent view detection", () => {
    it("passes isProponentView=false when onAcceptUpdate and onWithdrawUpdate are provided", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
          onAcceptUpdate={vi.fn()}
          onWithdrawUpdate={vi.fn()}
        />,
      );

      expect(screen.getByTestId("is-proponent-view")).toHaveTextContent("false");
    });

    it("passes isProponentView=true when onAcceptUpdate and onWithdrawUpdate are undefined", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
          onAcceptUpdate={undefined}
          onWithdrawUpdate={undefined}
        />,
      );

      expect(screen.getByTestId("is-proponent-view")).toHaveTextContent("true");
    });
  });

  describe("request count badge", () => {
    it("shows total count badge for active requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest()]}
          sentRequests={[makeSentRequest()]}
        />,
      );

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not show count badge when only previous requests exist", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          previousRequests={[makePreviousRequest()]}
        />,
      );

      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
  });

  describe("send request validation", () => {
    it("calls onSendRequests when all pending requests have reasons", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest({ reason: "Valid reason" })]}
        />,
      );

      fireEvent.click(screen.getByText("Send Request to Proponent"));

      expect(defaultProps.onSendRequests).toHaveBeenCalledTimes(1);
    });

    it("does not call onSendRequests when a pending request has empty reason", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest({ reason: "" })]}
        />,
      );

      fireEvent.click(screen.getByText("Send Request to Proponent"));

      expect(defaultProps.onSendRequests).not.toHaveBeenCalled();
    });

    it("does not call onSendRequests when a pending request has whitespace-only reason", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest({ reason: "   " })]}
        />,
      );

      fireEvent.click(screen.getByText("Send Request to Proponent"));

      expect(defaultProps.onSendRequests).not.toHaveBeenCalled();
    });

    it("sets validation error on requests with empty reasons", () => {
      const emptyReasonRequest = makePendingRequest({ itemTypeId: 20, reason: "" });
      const validRequest = makePendingRequest({ itemTypeId: 21, reason: "OK" });

      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[emptyReasonRequest, validRequest]}
        />,
      );

      fireEvent.click(screen.getByText("Send Request to Proponent"));

      // The empty one should have error
      const pendingWithError = screen.getByTestId("pending-request-20");
      expect(pendingWithError.querySelector('[data-testid="has-error"]')).toHaveTextContent("true");

      // The valid one should not
      const pendingWithoutError = screen.getByTestId("pending-request-21");
      expect(pendingWithoutError.querySelector('[data-testid="has-error"]')).toHaveTextContent("false");
    });
  });

  describe("send button state", () => {
    it("shows Send Request button when there are pending requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest()]}
        />,
      );

      expect(screen.getByText("Send Request to Proponent")).toBeInTheDocument();
    });

    it("does not show Send Request button when there are no pending requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
        />,
      );

      expect(screen.queryByText("Send Request to Proponent")).not.toBeInTheDocument();
    });

    it("disables Send Request button when isLoading is true", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest()]}
          isLoading={true}
        />,
      );

      expect(screen.getByText("Send Request to Proponent").closest("button")).toBeDisabled();
    });
  });

  describe("previous requests toggle", () => {
    it("shows View Previous Requests link", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
        />,
      );

      expect(screen.getByText("View Previous Requests")).toBeInTheDocument();
    });

    it("toggles to show previous requests section when clicked", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
          previousRequests={[makePreviousRequest()]}
        />,
      );

      fireEvent.click(screen.getByText("View Previous Requests"));

      expect(screen.getByText("Previous Requests")).toBeInTheDocument();
      expect(screen.getByText("Hide Previous Requests")).toBeInTheDocument();
    });

    it("shows no previous requests message when list is empty", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
          previousRequests={[]}
        />,
      );

      fireEvent.click(screen.getByText("View Previous Requests"));

      expect(screen.getByText("No previous update requests")).toBeInTheDocument();
    });
  });

  describe("awaiting response indicator", () => {
    it("shows awaiting entity response text when there are sent requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          sentRequests={[makeSentRequest()]}
        />,
      );

      expect(screen.getByText("Awaiting entity response")).toBeInTheDocument();
    });

    it("does not show awaiting text when there are no sent requests", () => {
      render(
        <SectionUpdateRequestPanel
          {...defaultProps}
          pendingRequests={[makePendingRequest()]}
        />,
      );

      expect(screen.queryByText("Awaiting entity response")).not.toBeInTheDocument();
    });
  });
});
