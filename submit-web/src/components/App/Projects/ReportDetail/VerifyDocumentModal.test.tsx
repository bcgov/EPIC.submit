import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  VerifyDocumentModal,
  COMPLIANCE_SELF_REPORT_HINT,
} from "./VerifyDocumentModal";

const setCloseSpy = vi.fn();
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setClose: setCloseSpy }),
}));

describe("VerifyDocumentModal", () => {
  beforeEach(() => {
    setCloseSpy.mockClear();
  });

  it("shows the file name and the confirm/cancel actions", () => {
    render(
      <VerifyDocumentModal
        fileName="report_2026.pdf"
        onVerify={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Verify Document")).toBeInTheDocument();
    expect(screen.getByText("report_2026.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm Verification" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows the Compliance Self-Report hint only when asked", () => {
    const { rerender } = render(
      <VerifyDocumentModal
        fileName="report.pdf"
        onVerify={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(
      screen.queryByText(COMPLIANCE_SELF_REPORT_HINT),
    ).not.toBeInTheDocument();

    rerender(
      <VerifyDocumentModal
        fileName="report.pdf"
        showComplianceHint
        onVerify={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText(COMPLIANCE_SELF_REPORT_HINT)).toBeInTheDocument();
  });

  it("does not verify and closes when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn().mockResolvedValue(undefined);
    render(<VerifyDocumentModal fileName="report.pdf" onVerify={onVerify} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onVerify).not.toHaveBeenCalled();
    expect(setCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("verifies and closes on confirm", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn().mockResolvedValue(undefined);
    render(<VerifyDocumentModal fileName="report.pdf" onVerify={onVerify} />);

    await user.click(
      screen.getByRole("button", { name: "Confirm Verification" }),
    );
    await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(1));
    expect(setCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("stays open with an error when verification fails", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn().mockRejectedValue(new Error("boom"));
    render(<VerifyDocumentModal fileName="report.pdf" onVerify={onVerify} />);

    await user.click(
      screen.getByRole("button", { name: "Confirm Verification" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/failed to verify the document/i),
      ).toBeInTheDocument(),
    );
    // The modal did not close on failure.
    expect(setCloseSpy).not.toHaveBeenCalled();
  });
});
