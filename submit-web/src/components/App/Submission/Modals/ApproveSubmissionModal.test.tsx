import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import ApproveSubmissionModal from "./ApproveSubmissionModal";

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

describe("ApproveSubmissionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_renders_updated_title_and_body_copy", () => {
    render(<ApproveSubmissionModal {...defaultProps} />);

    expect(
      screen.getByText(
        "You are confirming this Initial Project Description & Engagement Plan is approved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This decision will be recorded internally. No further changes can be made to this package after it has been approved.",
      ),
    ).toBeInTheDocument();
    // Title and confirm button both read "Approve Submission"
    expect(
      screen.getAllByText("Approve Submission").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("test_does_not_render_old_notification_sentence", () => {
    render(<ApproveSubmissionModal {...defaultProps} />);
    expect(
      screen.queryByText(/will be notified that their submission/i),
    ).not.toBeInTheDocument();
  });

  it("test_decision_date_defaults_to_today", () => {
    render(<ApproveSubmissionModal {...defaultProps} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe(dayjs().format("YYYY-MM-DD"));
  });

  it("test_confirm_enabled_with_default_date_and_passes_date", async () => {
    const onConfirm = vi.fn();
    render(<ApproveSubmissionModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", {
      name: "Approve Submission",
    });
    await waitFor(() => expect(confirmButton).toBeEnabled());

    await userEvent.click(confirmButton);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][0]).toHaveProperty("decisionDate");
  });

  it("test_confirm_disabled_and_error_shown_when_date_cleared", async () => {
    render(<ApproveSubmissionModal {...defaultProps} />);

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);

    await waitFor(() =>
      expect(screen.getByText("Decision Date is required")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Approve Submission" }),
    ).toBeDisabled();
  });

  it("test_renders_alert_modal_when_open_update_requests", () => {
    render(
      <ApproveSubmissionModal
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
