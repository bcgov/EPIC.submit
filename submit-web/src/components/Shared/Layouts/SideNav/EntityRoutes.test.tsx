import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntityRoutes from "./EntityRoutes";
import { ACCOUNT_USER_PERMISSIONS } from "@/models/Role";

const mockUseAccount = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: () => mockUseAccount(),
}));

// Render MainListItem as a simple element exposing the route name so we can
// assert which menu entries are present without pulling in the router.
vi.mock("./MainListItem", () => ({
  MainListItem: ({ route }: { route: { name: string } }) => (
    <div>{route.name}</div>
  ),
}));

// ProjectsSubRoutes relies on data hooks that are irrelevant to gating.
vi.mock("./ProjectsSubRoutes", () => ({
  default: () => <div>projects-sub-routes</div>,
}));

const setRoles = (roles: string[]) => {
  mockUseAccount.mockReturnValue({ roles });
};

describe("EntityRoutes - Documents menu permission gating", () => {
  beforeEach(() => {
    mockUseAccount.mockReset();
  });

  it("shows the Documents menu when the user has VIEW_ALL_DOCUMENTS", () => {
    setRoles([ACCOUNT_USER_PERMISSIONS.VIEW_ALL_DOCUMENTS]);

    render(<EntityRoutes />);

    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("hides the Documents menu for a collaborator without VIEW_ALL_DOCUMENTS", () => {
    // Collaborator roles resolve to no account-level permissions.
    setRoles([]);

    render(<EntityRoutes />);

    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
    // All Projects remains visible for every proponent user.
    expect(screen.getByText("All Projects")).toBeInTheDocument();
  });

  it("shows the Documents menu for users with full_access", () => {
    setRoles(["full_access"]);

    render(<EntityRoutes />);

    expect(screen.getByText("Documents")).toBeInTheDocument();
  });
});
