import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RefuseSubmissionModal from "./RefuseSubmissionModal";

const mockSetClose = vi.fn();
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setClose: mockSetClose, isLoading: false }),
}));

const defaultProps = {
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  hasOpenUpdateRequests: false,
  openRequestSectionNames: [],
};

describe("RefuseSubmissionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_renders_warning_sentence_verbatim", () => {
    render(<RefuseSubmissionModal {...defaultProps} />);
    expect(
      screen.getByText(
        "Not approving this package will require the entity to submit a new package. Any open update requests will be cancelled.",
      ),
    ).toBeInTheDocument();
  });

  it("test_renders_internal_record_sentence", () => {
    render(<RefuseSubmissionModal {...defaultProps} />);
    expect(
      screen.getByText(
        "This decision will be recorded internally. No further changes can be made to this package after it has been approved.",
      ),
    ).toBeInTheDocument();
  });

  it("test_does_not_render_old_notification_sentence", () => {
    render(<RefuseSubmissionModal {...defaultProps} />);
    expect(
      screen.queryByText(/automated notification will be sent/i),
    ).not.toBeInTheDocument();
  });

  it("test_reason_field_and_helper_text_unchanged", () => {
    render(<RefuseSubmissionModal {...defaultProps} />);
    expect(
      screen.getByText("Reason for not approving this package"),
    ).toBeInTheDocument();
    expect(screen.getByText("Internal note only.")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Provide a reason for not approving this package (optional)...",
      ),
    ).toBeInTheDocument();
  });

  it("test_confirm_disabled_and_error_shown_when_date_cleared", async () => {
    render(<RefuseSubmissionModal {...defaultProps} />);

    const dateInput = screen.getAllByRole("textbox")[0];
    await userEvent.clear(dateInput);

    await waitFor(() =>
      expect(screen.getByText("Decision Date is required")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Confirm Package is NOT Accepted" }),
    ).toBeDisabled();
  });

  it("test_confirm_passes_decision_date_and_reason", async () => {
    const onConfirm = vi.fn();
    render(<RefuseSubmissionModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", {
      name: "Confirm Package is NOT Accepted",
    });
    await waitFor(() => expect(confirmButton).toBeEnabled());

    await userEvent.click(confirmButton);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    const data = onConfirm.mock.calls[0][0];
    expect(data).toHaveProperty("decisionDate");
    expect(data).toHaveProperty("reason");
  });

  it("test_renders_alert_modal_when_open_update_requests", () => {
    render(
      <RefuseSubmissionModal
        {...defaultProps}
        hasOpenUpdateRequests
        openRequestSectionNames={["Section A"]}
      />,
    );
    expect(
      screen.getByText("Resolve Update Requests to Proceed"),
    ).toBeInTheDocument();
    expect(screen.getByText("Section A")).toBeInTheDocument();
  });
});
