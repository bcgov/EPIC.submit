import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountProject } from "@/models/Project";
import { SubmissionPackage, SubmissionPackageType } from "@/models/Package";
import { USER_MANAGEMENT_ROLE } from "@/models/Role";
import { USER_TYPE } from "@/models/User";
import { Role } from "@/models/AccountUser";
import { Project } from "./Project";

const mockUseAccount = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: () => mockUseAccount(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Keep the MP card out of the way; it has its own tests.
vi.mock("./ProjectSubmissionsCard", () => ({
  ProjectSubmissionsCard: () => <div data-testid="mp-card" />,
}));

// Capture the packages passed to the reports card.
const reportsCardSpy = vi.fn();
vi.mock("./ReportsRecurring/ReportsRecurringCard", () => ({
  ReportsRecurringCard: (props: { reportPackages: SubmissionPackage[] }) => {
    reportsCardSpy(props.reportPackages);
    return <div data-testid="reports-card" />;
  },
}));

const makePackage = (id: number, typeName: string): SubmissionPackage =>
  ({
    id,
    name: `Package ${id}`,
    status: [],
    type_id: 1,
    type: { id: 1, name: typeName, versioning_enabled: false, mandatory: false },
    items: [],
    account_project_id: 1,
    update_requests: [],
    all_update_requests: [],
  }) as unknown as SubmissionPackage;

const makeAccountProject = (): AccountProject => ({
  id: 1,
  project_id: 1,
  account_id: 1,
  project: {
    id: 1,
    name: "Cariboo Gold Project",
    proponent_id: 1,
    epic_guid: "guid",
    has_approved_condition: true,
  },
  packages: [
    makePackage(10, SubmissionPackageType.REPORT),
    makePackage(11, SubmissionPackageType.MANAGEMENT_PLAN),
    makePackage(12, SubmissionPackageType.REPORT),
  ],
});

const setAccount = (roles: Role[]) =>
  mockUseAccount.mockReturnValue({
    userType: USER_TYPE.PROPONENT,
    userManagementRoles: roles,
  });

const roleWith = (roleName: USER_MANAGEMENT_ROLE): Role =>
  (({
    role_name: roleName
  }) as Role);

describe("Project reports section gating", () => {
  beforeEach(() => {
    reportsCardSpy.mockClear();
  });

  it("renders the reports section for an allowed role", () => {
    setAccount([roleWith(USER_MANAGEMENT_ROLE.PROJECT_ADMIN)]);
    render(<Project accountProject={makeAccountProject()} />);
    expect(screen.getByTestId("reports-card")).toBeInTheDocument();
  });

  it("feeds only Report-type packages to the reports section", () => {
    setAccount([roleWith(USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN)]);
    render(<Project accountProject={makeAccountProject()} />);
    const passed = reportsCardSpy.mock.calls[0][0] as SubmissionPackage[];
    expect(passed.map((p) => p.id)).toEqual([10, 12]);
  });

  it("hides the reports section for Collaborator - Specific Submissions", () => {
    setAccount([roleWith(USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR)]);
    render(<Project accountProject={makeAccountProject()} />);
    expect(screen.queryByTestId("reports-card")).not.toBeInTheDocument();
  });
});
