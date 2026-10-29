import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PackageStatus, SubmissionPackage } from "@/models/Package";
import { ReportsTable } from "./ReportsTable";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Deterministic date formatting (avoid timezone shifts on a date-only string).
vi.mock("@/utils/dateUtils", () => ({
  default: { formatDate: (d?: string | number) => (d ? String(d) : "") },
}));

const makeReportPackage = (
  id: number,
  overrides: {
    status?: PackageStatus[];
    last_submitted_on?: string | null;
    report?: Record<string, unknown>;
  } = {},
): SubmissionPackage =>
  ({
    id,
    name: `Package ${id}`,
    status: overrides.status ?? [],
    last_submitted_on: overrides.last_submitted_on ?? null,
    type_id: 1,
    type: { id: 1, name: "Report", versioning_enabled: false, mandatory: false },
    items: [],
    account_project_id: 42,
    update_requests: [],
    all_update_requests: [],
    version: {
      id,
      package_id: id,
      version: 1,
      original_package_id: id,
      is_approved: false,
      is_enforceable: false,
      is_latest: true,
    },
    project_report: {
      id,
      project_id: 1,
      report_id: id,
      phase: "Construction",
      condition_number: 7,
      condition_subsection: "2",
      frequency: "Annually",
      timing:
        "Within 30 days of the anniversary of the certificate issuance date, every year for the life of the project",
      display_name: `Annual Report ${id}`,
      ...overrides.report,
    },
  }) as unknown as SubmissionPackage;

describe("ReportsTable", () => {
  it("renders one row per report package", () => {
    render(
      <ReportsTable
        reportPackages={[makeReportPackage(1), makeReportPackage(2)]}
      />,
    );
    expect(screen.getByText("Annual Report 1")).toBeInTheDocument();
    expect(screen.getByText("Annual Report 2")).toBeInTheDocument();
  });

  it("renders the full timing text without truncation", () => {
    const timing =
      "Within 30 days of the anniversary of the certificate issuance date, every year for the life of the project";
    render(
      <ReportsTable reportPackages={[makeReportPackage(1, { report: { timing } })]} />,
    );
    expect(screen.getByText(timing)).toBeInTheDocument();
  });

  it("shows Last Submitted and Status as placeholders announced as None when empty", () => {
    render(<ReportsTable reportPackages={[makeReportPackage(1)]} />);
    const noneCells = screen.getAllByLabelText("None");
    expect(noneCells).toHaveLength(2);
    noneCells.forEach((cell) => expect(cell).toHaveTextContent("-"));
  });

  it("renders the Last Submitted date when present", () => {
    render(
      <ReportsTable
        reportPackages={[makeReportPackage(1, { last_submitted_on: "2026-09-30" })]}
      />,
    );
    expect(screen.getByText("2026-09-30")).toBeInTheDocument();
  });

  it("renders a New Submission status when a document is awaiting verification", () => {
    render(
      <ReportsTable
        reportPackages={[makeReportPackage(1, { status: ["NEW_SUBMISSION"] })]}
      />,
    );
    expect(screen.getByText("New Submission")).toBeInTheDocument();
  });

  it("links the submission name to the Regulated Party report page by default", () => {
    render(<ReportsTable reportPackages={[makeReportPackage(5)]} />);
    fireEvent.click(screen.getByText("Annual Report 5"));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/proponent/projects/42/reports/5",
    });
  });

  it("links the submission name to the EAO report page for the staff audience", () => {
    mockNavigate.mockClear();
    render(<ReportsTable reportPackages={[makeReportPackage(5)]} audience="staff" />);
    fireEvent.click(screen.getByText("Annual Report 5"));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/staff/projects/42/reports/5",
    });
  });
});
