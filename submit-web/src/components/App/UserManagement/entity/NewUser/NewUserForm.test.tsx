import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewUserForm from "./NewUserForm";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";

// --- Mocks ---

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// The adding user is an Account Admin with access to projects 101 and 102.
vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({
    accountId: 1,
    proponentId: 5,
    userManagementRoles: [
      {
        role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
        account_project_id: 1,
      },
      {
        role_name: USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN,
        account_project_id: 2,
      },
    ],
  }),
}));

const accountProjectsData = [
  { id: 1, project_id: 101, account_id: 1, project: { name: "Project Alpha" } },
  { id: 2, project_id: 102, account_id: 1, project: { name: "Project Beta" } },
];

vi.mock("@/hooks/api/useProjects", () => ({
  useGetAccountProjectsByAccount: () => ({ data: accountProjectsData }),
  getAccountPackagesByAccountIdQueryOptions: () => ({
    queryKey: ["account-packages"],
    queryFn: () => [],
  }),
}));

const mockCreateInvite = vi.fn();
vi.mock("@/hooks/api/useInvitations", () => ({
  useCreateInvitationToExistingProject: () => ({
    mutate: mockCreateInvite,
    isPending: false,
  }),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setOpen: vi.fn(), setClose: vi.fn() }),
}));

// useQuery returns empty account packages (not pending) so the form renders.
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isPending: false }),
}));

describe("NewUserForm - Collaborator - All Submissions in Project(s)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectCollaboratorAllInProjects = async () => {
    const radio = screen.getByLabelText(
      "Collaborator - All Submissions in Project(s)",
    );
    await userEvent.click(radio);
  };

  it("reveals the project selector when the role is selected", async () => {
    render(<NewUserForm />);
    await selectCollaboratorAllInProjects();

    expect(
      screen.getByText(
        "Which project(s) would you like to assign this user to?",
      ),
    ).toBeInTheDocument();
  });

  it("blocks submit and shows validation when no project is selected", async () => {
    render(<NewUserForm />);

    await userEvent.type(
      screen.getByRole("textbox"),
      "collab@example.com",
    );
    await selectCollaboratorAllInProjects();

    await userEvent.click(screen.getByRole("button", { name: /add user/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Please select at least one project."),
      ).toBeInTheDocument();
    });
    expect(mockCreateInvite).not.toHaveBeenCalled();
  });

  it("sends only the selected project subset (not all projects) on save", async () => {
    render(<NewUserForm />);

    await userEvent.type(
      screen.getByRole("textbox"),
      "collab@example.com",
    );
    await selectCollaboratorAllInProjects();

    // Open the project selector and choose a single project.
    const projectInput = screen.getByRole("combobox");
    await userEvent.click(projectInput);
    await userEvent.click(await screen.findByText("Project Alpha"));

    await userEvent.click(screen.getByRole("button", { name: /add user/i }));

    await waitFor(() => {
      expect(mockCreateInvite).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateInvite.mock.calls[0][0];
    expect(payload.role_name).toBe(USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN);
    // Only the selected project (101), not both 101 and 102.
    expect(payload.project_ids).toEqual([101]);
    // No submissions are hand-picked for this role.
    expect(payload.original_package_ids).toEqual([]);
  });
});
