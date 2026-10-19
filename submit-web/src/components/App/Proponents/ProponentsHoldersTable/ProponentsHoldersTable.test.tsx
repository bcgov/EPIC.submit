import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProponentsHoldersTable } from "./ProponentsHoldersTable";
import { useProponentsHoldersTable } from "./proponentsHoldersTableStore";
import { Proponent } from "@/models/Proponent";

// --- Mocks ---

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { error: vi.fn() },
}));

const mockProponents: Proponent[] = [
  {
    id: 1,
    name: "A Very Long Proponent Or Certificate Holder Company Name Limited",
    status: "ONBOARDED",
  } as Proponent,
  {
    id: 2,
    name: "Short Co",
    status: "INVITE_GENERATED",
  } as Proponent,
];

const mockUseGetAllProponents = vi.fn();
vi.mock("@/hooks/api/useProponents", () => ({
  useGetAllProponents: () => mockUseGetAllProponents(),
}));

describe("ProponentsHoldersTable", () => {
  beforeEach(() => {
    useProponentsHoldersTable.getState().resetFilters();
    mockUseGetAllProponents.mockReturnValue({
      data: mockProponents,
      isPending: false,
      isError: false,
    });
  });

  it("renders the Entities, Status and Actions column headers", () => {
    render(<ProponentsHoldersTable />);

    const headers = screen.getAllByRole("columnheader");
    const headerText = headers.map((h) => h.textContent);

    expect(headerText).toContain("Entities");
    expect(headerText).toContain("Status");
    expect(headerText).toContain("Actions");
  });

  it("gives the Entities column the most width so long names do not wrap", () => {
    render(<ProponentsHoldersTable />);

    const headers = screen.getAllByRole("columnheader");
    const byLabel = (label: string) =>
      headers.find((h) => h.textContent?.includes(label)) as HTMLElement;

    expect(byLabel("Entities")).toHaveStyle({ width: "60%" });
    expect(byLabel("Status")).toHaveStyle({ width: "15%" });
    expect(byLabel("Actions")).toHaveStyle({ width: "25%" });
  });

  it("renders proponent names and their status chips", () => {
    render(<ProponentsHoldersTable />);

    expect(
      screen.getByText(
        "A Very Long Proponent Or Certificate Holder Company Name Limited",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Short Co")).toBeInTheDocument();

    // Status chips are rendered from the status column.
    const table = screen.getByRole("table");
    expect(within(table).getByText("Onboarded")).toBeInTheDocument();
    expect(within(table).getByText("Invite Generated")).toBeInTheDocument();
  });
});
