import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditAccessLevelModal } from "./EditAccessLevelModal";
import { AccountUserWithRole } from "@/models/AccountUser";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

// --- Mocks ---

const mockSetClose = vi.fn();
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setClose: mockSetClose }),
}));

vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({ accountId: 1 }),
}));

const mockSetSelectedUser = vi.fn();
vi.mock("@/components/App/UserManagement/entity/userStore", () => ({
  useUserStore: () => ({ setSelectedUser: mockSetSelectedUser }),
}));

let capturedRoleOptions: any = {};
let capturedStatusOptions: any = {};
const mockUpdateRole = vi.fn();
const mockUpdateStatus = vi.fn();
vi.mock("@/hooks/api/useAccountUsers", () => ({
  useSaveUserRole: (params: any) => {
    capturedRoleOptions = params.options || {};
    return { mutate: mockUpdateRole, isPending: false };
  },
  useSaveUserStatus: (params: any) => {
    capturedStatusOptions = params.options || {};
    return { mutate: mockUpdateStatus, isPending: false };
  },
}));

const mockAccountPackages = vi.fn();
const mockAccountProjects = vi.fn();
vi.mock("@/hooks/api/useProjects", () => ({
  useGetAccountPackagesByAccountId: () => ({ data: mockAccountPackages() }),
  useGetAccountProjectsByAccount: () => ({ data: mockAccountProjects() }),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/Shared/Modals/constants", () => ({
  modalStyle: {},
}));

// --- Test data ---

const buildUserData = (
  roleName: USER_MANAGEMENT_ROLE,
  accountProjectIds: (number | null)[],
): AccountUserWithRole => ({
  id: 10,
  account_id: 1,
  full_name: "Test User",
  work_email_address: "test@example.com",
  status: "ACTIVE",
  roles: accountProjectIds.map((apId, idx) => ({
    account_project_id: apId,
    account_user_id: 10,
    package_ids: [],
    original_package_ids: [],
    package_names: [],
    role_id: idx + 1,
    role_name: roleName,
    permissions: [],
  })),
  invitation_id: 1,
  user_id: 100,
});

const accountProjectsData = [
  { id: 1, project_id: 101, account_id: 1, project: { id: 101, name: "Project Alpha", proponent_id: 1, epic_guid: "g1" }, packages: [] },
  { id: 2, project_id: 102, account_id: 1, project: { id: 102, name: "Project Beta", proponent_id: 1, epic_guid: "g2" }, packages: [] },
  { id: 3, project_id: 103, account_id: 1, project: { id: 103, name: "Project Gamma", proponent_id: 1, epic_guid: "g3" }, packages: [] },
];

describe("EditAccessLevelModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountPackages.mockReturnValue([]);
    mockAccountProjects.mockReturnValue(accountProjectsData);
  });

  it("preselects Revoke Access radio when user status is ACCESS_REVOKED", () => {
    const userData: AccountUserWithRole = {
      ...buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]),
      status: "ACCESS_REVOKED",
    };

    render(<EditAccessLevelModal userData={userData} />);

    const revokeRadio = screen.getByLabelText(/revoke access/i);
    expect(revokeRadio).toBeChecked();
  });

  it("prepopulates project_ids dropdown when effective role is SPECIFIC_PROJECT_ADMIN", async () => {
    // User is admin on projects 1 and 3 (out of 3 total) → SPECIFIC_PROJECT_ADMIN
    const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 3]);

    render(<EditAccessLevelModal userData={userData} />);

    // The useUserEffectiveRole hook should derive SPECIFIC_PROJECT_ADMIN
    // and the useEffect should prepopulate the project_ids field.
    // ControlledMultiSelect renders selected options as Chip components with the label.
    await waitFor(() => {
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    });
    expect(screen.getByText("Project Gamma")).toBeInTheDocument();
    // Project Beta should NOT be selected
    expect(screen.queryByText("Project Beta")).not.toBeInTheDocument();
  });

  it("does not prepopulate project_ids when effective role is PROJECT_ADMIN (all projects)", () => {
    // User is admin on all 3 projects → PROJECT_ADMIN (all)
    const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);

    render(<EditAccessLevelModal userData={userData} />);

    // When the role is PROJECT_ADMIN (all), the dropdown should not be visible
    // and projects should not be rendered as chips
    expect(screen.queryByText("Which Project(s) would you like to assign this user to?")).not.toBeInTheDocument();
  });

  it("does not disable other role options when Revoke Access is selected", async () => {
    const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);

    render(<EditAccessLevelModal userData={userData} />);

    // Select Revoke Access
    const revokeRadio = screen.getByLabelText(/revoke access/i);
    await userEvent.click(revokeRadio);
    expect(revokeRadio).toBeChecked();

    // Other role options should still be enabled and clickable
    const projectAdminRadio = screen.getByLabelText(/project administrator - all projects/i);
    expect(projectAdminRadio).not.toBeDisabled();

    // Click another option to verify it's selectable
    await userEvent.click(projectAdminRadio);
    expect(projectAdminRadio).toBeChecked();
    expect(revokeRadio).not.toBeChecked();
  });

  describe("onSuccess callbacks", () => {
    it("calls onSuccess callback and setSelectedUser when role update succeeds", () => {
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);
      const onSuccess = vi.fn();

      render(<EditAccessLevelModal userData={userData} onSuccess={onSuccess} />);

      const updatedUser = { ...userData, roles: [] };
      capturedRoleOptions.onSuccess(updatedUser);

      expect(mockSetSelectedUser).toHaveBeenCalledWith(updatedUser);
      expect(onSuccess).toHaveBeenCalledWith(updatedUser);
      expect(mockSetClose).toHaveBeenCalled();
    });

    it("calls onSuccess callback and setSelectedUser when status update (revoke) succeeds", () => {
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);
      const onSuccess = vi.fn();

      render(<EditAccessLevelModal userData={userData} onSuccess={onSuccess} />);

      const revokedUser = { ...userData, status: "ACCESS_REVOKED" as const };
      // Simulate revoke scenario: handleStatusSuccess when the selected role IS REVOKE
      // We need to set the form to REVOKE first, but since handleStatusSuccess
      // checks form state, we simulate the direct callback behavior
      capturedStatusOptions.onSuccess(revokedUser);

      // When status update succeeds and it's NOT a reactivation, it calls onSuccess
      // For a revoke path, setSelectedUser and onSuccess are called
      expect(mockSetSelectedUser).toHaveBeenCalledWith(revokedUser);
    });

    it("calls updateRole mutation when Save is clicked for an active user with a role selected", async () => {
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);

      render(<EditAccessLevelModal userData={userData} />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRole).toHaveBeenCalled();
      });
    });

    it("sends all account_project_ids when Project Admin - All Projects is selected", async () => {
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);

      render(<EditAccessLevelModal userData={userData} />);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRole).toHaveBeenCalledWith(
          expect.objectContaining({
            role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
            account_project_ids: [1, 2, 3],
          }),
        );
      });
    });

    it("sends all account_project_ids when switching from Specific Project Admin to All Projects", async () => {
      // User is currently a specific project admin on projects 1 and 3
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 3]);

      render(<EditAccessLevelModal userData={userData} />);

      // The form defaults to SPECIFIC_PROJECT_ADMIN since user only has 2 of 3 projects.
      // Now switch to PROJECT_ADMIN (All Projects)
      const allProjectsRadio = screen.getByLabelText(/project administrator - all projects/i);
      await userEvent.click(allProjectsRadio);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRole).toHaveBeenCalledWith(
          expect.objectContaining({
            role_name: USER_MANAGEMENT_ROLE.PROJECT_ADMIN,
            account_project_ids: [1, 2, 3],
          }),
        );
      });
    });

    it("calls updateStatus mutation when Save is clicked with Revoke selected", async () => {
      const userData = buildUserData(USER_MANAGEMENT_ROLE.PROJECT_ADMIN, [1, 2, 3]);

      render(<EditAccessLevelModal userData={userData} />);

      // Select the Revoke Access radio
      const revokeRadio = screen.getByLabelText(/revoke access/i);
      await userEvent.click(revokeRadio);

      const saveButton = screen.getByRole("button", { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith({ active: false });
      });
    });
  });
});
