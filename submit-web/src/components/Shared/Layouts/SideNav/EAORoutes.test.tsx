import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import EAORoutes from "./EAORoutes";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

// Mock useHasRole so we can control the full_access check.
const mockUseHasRole = vi.fn();
vi.mock("@/hooks/common", () => ({
  useHasRole: (...args: unknown[]) => mockUseHasRole(...args),
}));

// Mock MainListItem to avoid pulling in the router; render the route name so
// we can assert on which nav items appear.
vi.mock("./MainListItem", () => ({
  MainListItem: ({ route }: { route: { name: string; path: string } }) => (
    <div data-testid="main-list-item">{route.name}</div>
  ),
}));

describe("EAORoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always shows the non-restricted staff routes", () => {
    mockUseHasRole.mockReturnValue(false);

    render(<EAORoutes />);

    expect(screen.getByText("Submission Review")).toBeInTheDocument();
    expect(screen.getByText("Document Library")).toBeInTheDocument();
    expect(screen.getByText("Proponents/Holders")).toBeInTheDocument();
  });

  it("checks for the full_access role to gate Configurations", () => {
    mockUseHasRole.mockReturnValue(false);

    render(<EAORoutes />);

    expect(mockUseHasRole).toHaveBeenCalledWith(EPIC_SUBMIT_ROLE.full_access);
  });

  it("shows Configurations when the user has full_access", () => {
    mockUseHasRole.mockReturnValue(true);

    render(<EAORoutes />);

    expect(screen.getByText("Configurations")).toBeInTheDocument();
  });

  it("hides Configurations when the user lacks full_access", () => {
    mockUseHasRole.mockReturnValue(false);

    render(<EAORoutes />);

    expect(screen.queryByText("Configurations")).not.toBeInTheDocument();
  });
});
