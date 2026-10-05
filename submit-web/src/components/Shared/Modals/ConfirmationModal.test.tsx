import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./ConfirmationModal";

const mockSetClose = vi.fn();
vi.mock("./modalStore", () => ({
  useModal: () => ({ setClose: mockSetClose, isLoading: false }),
}));

describe("ConfirmationModal", () => {
  it("test_confirm_enabled_by_default", () => {
    render(
      <ConfirmationModal
        title="Approve Submission"
        description="Body"
        onConfirm={vi.fn()}
        confirmText="Approve Submission"
      />,
    );

    const confirmButton = screen.getByRole("button", {
      name: "Approve Submission",
    });
    expect(confirmButton).toBeEnabled();
  });

  it("test_confirm_disabled_when_confirm_disabled_prop_true", () => {
    render(
      <ConfirmationModal
        title="Approve Submission"
        description="Body"
        onConfirm={vi.fn()}
        confirmText="Approve Submission"
        confirmDisabled
      />,
    );

    const confirmButton = screen.getByRole("button", {
      name: "Approve Submission",
    });
    expect(confirmButton).toBeDisabled();
  });

  it("test_confirm_click_invokes_on_confirm_when_enabled", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal
        title="Approve Submission"
        description="Body"
        onConfirm={onConfirm}
        confirmText="Approve Submission"
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Approve Submission" }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
