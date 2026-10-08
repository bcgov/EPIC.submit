import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProponentStatusFilter from "./ProponentStatusFilter";
import { useProponentsHoldersTable } from "@/components/App/Proponents/ProponentsHoldersTable/proponentsHoldersTableStore";

describe("ProponentStatusFilter", () => {
  beforeEach(() => {
    // Reset the zustand store between tests.
    useProponentsHoldersTable.getState().resetFilters();
  });

  it("renders the Invite Generated option in the dropdown", async () => {
    const user = userEvent.setup();
    render(<ProponentStatusFilter />);

    // Open the Select dropdown.
    await user.click(screen.getByRole("combobox"));

    const listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).getByText("Invite Generated"),
    ).toBeInTheDocument();
  });

  it("renders all expected status options", async () => {
    const user = userEvent.setup();
    render(<ProponentStatusFilter />);

    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");

    [
      "Eligible",
      "Invite Generated",
      "Pending Onboarding",
      "Invite Expired",
      "Ineligible",
      "Onboarded",
    ].forEach((label) => {
      expect(within(listbox).getByText(label)).toBeInTheDocument();
    });
  });

  it("renders two selected badges on the same row when multiple options are selected", () => {
    useProponentsHoldersTable
      .getState()
      .setStatusFilters(["ELIGIBLE", "INVITE_GENERATED"]);

    render(<ProponentStatusFilter />);

    // Both selected statuses are shown as chips in the collapsed control.
    expect(screen.getByText("Eligible")).toBeInTheDocument();
    expect(screen.getByText("Invite Generated")).toBeInTheDocument();
  });
});
