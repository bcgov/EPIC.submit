import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserRoleOptions } from "./UserRoleOptions";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

// Mock the account store
vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({ accountId: 1 }),
}));

// Mock the projects hook - must return the full module shape
vi.mock("@/hooks/api/useProjects", () => ({
  useGetAccountProjectsByAccount: () => ({
    data: [
      { id: 1, project_id: 1, project: { name: "Project A" } },
      { id: 2, project_id: 2, project: { name: "Project B" } },
    ],
  }),
  getAccountPackagesByAccountIdQueryOptions: () => ({}),
}));

describe("UserRoleOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all role options when no roles are excluded", () => {
    render(<UserRoleOptions error={false} />);

    expect(
      screen.getByLabelText("Regulated Party Account Administrator"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Project Administrator - All Projects"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Project Administrator - Specific Project(s)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collaborator - All Submissions in Project(s)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collaborator - Specific Submissions"),
    ).toBeInTheDocument();
  });

  it("excludes Account Administrator option when ACCOUNT_PRIMARY_ADMIN is in excludeRoles", () => {
    render(
      <UserRoleOptions
        error={false}
        excludeRoles={[USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN]}
      />,
    );

    expect(
      screen.queryByLabelText("Regulated Party Account Administrator"),
    ).not.toBeInTheDocument();

    // Other options should still be visible
    expect(
      screen.getByLabelText("Project Administrator - All Projects"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Project Administrator - Specific Project(s)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collaborator - All Submissions in Project(s)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collaborator - Specific Submissions"),
    ).toBeInTheDocument();
  });

  it("allows excluding multiple roles simultaneously", () => {
    render(
      <UserRoleOptions
        error={false}
        excludeRoles={[
          USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
          USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN,
        ]}
      />,
    );

    expect(
      screen.queryByLabelText("Regulated Party Account Administrator"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Collaborator - All Submissions in Project(s)"),
    ).not.toBeInTheDocument();

    // Remaining options are still shown
    expect(
      screen.getByLabelText("Project Administrator - All Projects"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Collaborator - Specific Submissions"),
    ).toBeInTheDocument();
  });

  it("renders selectionsNode under the selected Collaborator - All Submissions in Project(s) role", () => {
    render(
      <UserRoleOptions
        error={false}
        selectedRole={USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN}
        selectionsNode={<div data-testid="project-selector" />}
      />,
    );

    expect(screen.getByTestId("project-selector")).toBeInTheDocument();
  });

  it("does not render selectionsNode when no role is selected", () => {
    render(
      <UserRoleOptions
        error={false}
        selectedRole={""}
        selectionsNode={<div data-testid="project-selector" />}
      />,
    );

    expect(screen.queryByTestId("project-selector")).not.toBeInTheDocument();
  });
});
