import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewUserForm from "./NewUserForm";

// --- Mocks ---

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({
    accountId: 1,
    proponentId: 2,
    userManagementRoles: [
      { role_name: "ACCOUNT_PRIMARY_ADMIN", account_project_id: 1 },
    ],
  }),
}));

vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setOpen: vi.fn(), setClose: vi.fn() }),
}));

vi.mock("@/hooks/api/useInvitations", () => ({
  useCreateInvitationToExistingProject: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

const accountProjectsData = [
  {
    id: 1,
    project_id: 101,
    account_id: 1,
    project: { id: 101, name: "Project Alpha", proponent_id: 1, epic_guid: "g1" },
    packages: [],
  },
  {
    id: 2,
    project_id: 102,
    account_id: 1,
    project: { id: 102, name: "Project Beta", proponent_id: 1, epic_guid: "g2" },
    packages: [],
  },
];

const accountPackagesData = [
  {
    project_id: "102",
    packages: [{ id: 3, name: "Shared Plan", original_package_id: 33 }],
  },
  {
    project_id: "101",
    packages: [{ id: 1, name: "Shared Plan", original_package_id: 11 }],
  },
];

vi.mock("@/hooks/api/useProjects", () => ({
  useGetAccountProjectsByAccount: () => ({ data: accountProjectsData }),
  getAccountPackagesByAccountIdQueryOptions: () => ({
    queryKey: ["packages"],
    queryFn: () => accountPackagesData,
  }),
}));

// Only override useQuery; keep the rest of react-query intact.
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: () => ({ data: accountPackagesData, isPending: false }),
  };
});

const openSubmissionsPicker = async () => {
  const collaboratorRadio = screen.getByLabelText(
    /collaborator - specific submissions/i,
  );
  await userEvent.click(collaboratorRadio);

  const combobox = screen.getByRole("combobox");
  // MUI Autocomplete opens the listbox on ArrowDown.
  combobox.focus();
  await userEvent.keyboard("{ArrowDown}");
};

describe("NewUserForm - specific submissions picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders submission options as 'Project: Submission Name' sorted by project", async () => {
    render(<NewUserForm />);
    await openSubmissionsPicker();

    const listbox = await screen.findByRole("listbox");
    const optionLabels = within(listbox)
      .getAllByRole("option")
      .map((o) => o.textContent);

    // Both identically named submissions appear, each prefixed by its project,
    // and options are sorted by project name.
    expect(optionLabels).toEqual([
      "Project Alpha: Shared Plan",
      "Project Beta: Shared Plan",
    ]);
  });

  it("renders the selected submission as a chip in 'Project: Submission Name' format", async () => {
    render(<NewUserForm />);
    await openSubmissionsPicker();

    const option = await screen.findByText("Project Alpha: Shared Plan");
    await userEvent.click(option);

    // The chip uses the same label.
    expect(screen.getByText("Project Alpha: Shared Plan")).toBeInTheDocument();
  });
});
