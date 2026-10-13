import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviousRequestCollapsible } from "./PreviousRequestCollapsible";
import { PreviousRequest } from "./types";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";

// Expose the theme passed to the shared StatusChip so we can assert the color
// system (Withdrawn must render in the yellow/warning family, not danger).
vi.mock("@/components/Shared/StatusChip", () => ({
  StatusChip: ({ label, theme }: { label: string; theme?: string }) => (
    <span data-testid="status-chip" data-theme={theme}>
      {label}
    </span>
  ),
}));

const baseRequest: PreviousRequest = {
  updateRequestId: 1,
  itemTypeId: 10,
  itemTypeName: "Geospatial Information",
  reason: "Please upload updated GIS files",
  createdDate: "2024-06-01T00:00:00Z",
  createdBy: "staff-user",
  status: UPDATE_REQUEST_STATUS.CLOSED.value,
};

describe("PreviousRequestCollapsible status badge", () => {
  it("renders the Withdrawn badge in the yellow (warning) family", () => {
    render(
      <PreviousRequestCollapsible
        request={baseRequest}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    const chip = screen.getByTestId("status-chip");
    expect(chip).toHaveTextContent("Withdrawn");
    expect(chip).toHaveAttribute("data-theme", "warning");
  });

  it("renders the Accepted badge in the success theme", () => {
    render(
      <PreviousRequestCollapsible
        request={{
          ...baseRequest,
          status: UPDATE_REQUEST_STATUS.ACCEPTED.value,
        }}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    const chip = screen.getByTestId("status-chip");
    expect(chip).toHaveTextContent("Accepted");
    expect(chip).toHaveAttribute("data-theme", "success");
  });
});
