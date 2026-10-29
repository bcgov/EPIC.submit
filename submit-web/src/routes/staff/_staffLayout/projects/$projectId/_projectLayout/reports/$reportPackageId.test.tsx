import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Capture the component passed to createFileRoute so we can render it directly.
const routeHolder = vi.hoisted(() => ({
  component: undefined as (() => JSX.Element) | undefined,
}));

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
import "./$reportPackageId";

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

  it("does not render an Add Document button (read-only page)", () => {
    render(<StaffReportDetailPage />);
    expect(screen.queryByText("Add Document")).not.toBeInTheDocument();
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
});
