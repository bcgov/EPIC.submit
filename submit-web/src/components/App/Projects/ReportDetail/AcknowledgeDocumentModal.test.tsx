import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcknowledgeDocumentModal } from "./AcknowledgeDocumentModal";
import { acknowledgeDocumentMessage } from "./acknowledgeDocumentMessage";

const setCloseSpy = vi.fn();
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setClose: setCloseSpy }),
}));

describe("AcknowledgeDocumentModal", () => {
  beforeEach(() => {
    setCloseSpy.mockClear();
  });

  it("shows the title, file name, phase message and actions", () => {
    render(
      <AcknowledgeDocumentModal
        fileName="CSR_2026.pdf"
        phase="Construction"
        onAcknowledge={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Acknowledge Document")).toBeInTheDocument();
    expect(screen.getByText("CSR_2026.pdf")).toBeInTheDocument();
    expect(
      screen.getByText(acknowledgeDocumentMessage("Construction")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm Acknowledgement" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("does not acknowledge and closes when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn().mockResolvedValue(undefined);
    render(
      <AcknowledgeDocumentModal
        fileName="report.pdf"
        phase="Construction"
        onAcknowledge={onAcknowledge}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onAcknowledge).not.toHaveBeenCalled();
    expect(setCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("acknowledges and closes on confirm", async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn().mockResolvedValue(undefined);
    render(
      <AcknowledgeDocumentModal
        fileName="report.pdf"
        phase="Construction"
        onAcknowledge={onAcknowledge}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm Acknowledgement" }),
    );
    await waitFor(() => expect(onAcknowledge).toHaveBeenCalledTimes(1));
    expect(setCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("stays open with an error when acknowledgement fails", async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn().mockRejectedValue(new Error("boom"));
    render(
      <AcknowledgeDocumentModal
        fileName="report.pdf"
        phase="Construction"
        onAcknowledge={onAcknowledge}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm Acknowledgement" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/failed to acknowledge the document/i),
      ).toBeInTheDocument(),
    );
    // The modal did not close on failure.
    expect(setCloseSpy).not.toHaveBeenCalled();
  });
});
