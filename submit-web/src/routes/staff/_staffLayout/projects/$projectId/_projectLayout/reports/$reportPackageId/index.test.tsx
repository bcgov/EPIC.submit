import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Capture the component passed to createFileRoute so we can render it directly.
const routeHolder = vi.hoisted(() => ({
  component: undefined as (() => JSX.Element) | undefined,
}));

// Roles of the signed-in staff user; each test sets what it needs.
const accountHolder = vi.hoisted(() => ({ roles: [] as string[] }));

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => JSX.Element }) => {
    routeHolder.component = options.component;
    return {};
  },
  useNavigate: () => mockNavigate,
  useParams: () => ({ projectId: "7", reportPackageId: "42" }),
  Navigate: () => <div data-testid="navigate-error" />,
  notFound: () => new Error("not found"),
}));

vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({ roles: accountHolder.roles }),
}));

// Drive both suspense queries: first call returns the account project, second
// returns the report package. Order matches the component's query calls.
const mockUseSuspenseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: (options: unknown) => mockUseSuspenseQuery(options),
}));

// Query option factories are called with ids; return identifiable markers.
vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: () => ({ key: "package" }),
}));
vi.mock("@/hooks/api/useProjects", () => ({
  getAccountProjectForStaffQueryOptions: () => ({ key: "project" }),
}));

// Stub the heavy child components so the test focuses on page composition.
// (SubmissionTitle pulls in the whole @mui/icons-material barrel.)
vi.mock("@/components/App/Submission/SubmissionTitle", () => ({
  SubmissionTitle: () => <div data-testid="submission-title" />,
}));
vi.mock("@/components/App/Projects/ReportDetail/ReportInfoBox", () => ({
  ReportInfoBox: () => <div data-testid="report-info-box" />,
}));
const submissionsTableSpy = vi.fn();
vi.mock("@/components/App/Projects/ReportDetail/ReportSubmissionsTable", () => ({
  ReportSubmissionsTable: (props: { audience?: string }) => {
    submissionsTableSpy(props.audience);
    return <div data-testid="report-submissions-table" />;
  },
}));

const ACCOUNT_PROJECT = {
  id: 7,
  project: {
    name: "Cariboo Gold Project",
    proponent: { name: "Osisko Development Corp." },
    ea_certificate: "E23-01",
  },
};

const REPORT_PACKAGE = {
  id: 42,
  name: "Compliance Self-Report",
  project_report: {
    display_name: "Compliance Self-Report",
    report_type: "Compliance Self-Report",
    phase: "Construction",
    condition_number: 6,
    condition_subsection: "2",
    frequency: "Annually",
    timing: "On or before March 31 of each year",
  },
};

const setQueries = (accountProject: unknown, reportPackage: unknown) => {
  mockUseSuspenseQuery.mockImplementation((options: { key: string }) => {
    if (options.key === "project") return { data: accountProject };
    return { data: reportPackage };
  });
};

// Import after mocks are registered so createFileRoute captures the component.
import "./index";

const StaffReportDetailPage = () => {
  if (!routeHolder.component) {
    throw new Error("Route component was not captured");
  }
  const Component = routeHolder.component;
  return <Component />;
};

describe("Staff report detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountHolder.roles = ["eao_view"];
    setQueries(ACCOUNT_PROJECT, REPORT_PACKAGE);
  });

  it("renders the title as '[Report name]: [Phase]'", () => {
    render(<StaffReportDetailPage />);
    expect(
      screen.getByText("Compliance Self-Report: Construction"),
    ).toBeInTheDocument();
  });

  it("renders the info box and the submissions table with the staff audience", () => {
    render(<StaffReportDetailPage />);
    expect(screen.getByTestId("report-info-box")).toBeInTheDocument();
    expect(screen.getByTestId("report-submissions-table")).toBeInTheDocument();
    expect(submissionsTableSpy).toHaveBeenCalledWith("staff");
  });

  it("navigates back to staff Projects on Save & Close", () => {
    render(<StaffReportDetailPage />);
    fireEvent.click(screen.getByText("Save & Close"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/staff/projects" });
  });

  it("redirects to the error page when the report obligation is missing", () => {
    setQueries(ACCOUNT_PROJECT, { id: 42, name: "x", project_report: null });
    render(<StaffReportDetailPage />);
    expect(screen.getByTestId("navigate-error")).toBeInTheDocument();
  });

  describe("+ Add Document button", () => {
    it.each([
      ["MPT Staff", ["eao_view", "mp_edit"]],
      ["MPT Manager", ["eao_view", "mp_extended_edit"]],
      ["full access", ["eao_view", "full_access"]],
    ])("shows for %s", (_label, roles) => {
      accountHolder.roles = roles;
      render(<StaffReportDetailPage />);
      expect(
        screen.getByRole("button", { name: /add document/i }),
      ).toBeInTheDocument();
    });

    it.each([
      ["view-only EAO staff", ["eao_view"]],
      ["EAO editors without an MPT role", ["eao_view", "eao_edit"]],
      ["MPT viewers", ["eao_view", "mp_view"]],
      ["no roles", []],
    ])("is hidden for %s", (_label, roles) => {
      accountHolder.roles = roles;
      render(<StaffReportDetailPage />);
      expect(
        screen.queryByRole("button", { name: /add document/i }),
      ).not.toBeInTheDocument();
    });

    it("opens the staff add-document page for this report", () => {
      accountHolder.roles = ["eao_view", "mp_edit"];
      render(<StaffReportDetailPage />);

      fireEvent.click(screen.getByRole("button", { name: /add document/i }));

      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/staff/projects/$projectId/reports/$reportPackageId/add-document",
        params: { projectId: "7", reportPackageId: "42" },
      });
    });
  });
});
