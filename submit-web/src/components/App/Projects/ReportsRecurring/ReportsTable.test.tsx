import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubmissionPackage } from "@/models/Package";
import { ReportsTable } from "./ReportsTable";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const makeReportPackage = (
  id: number,
  overrides: Record<string, unknown> = {},
): SubmissionPackage =>
  ({
    id,
    name: `Package ${id}`,
    status: [],
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
      ...overrides,
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
    render(<ReportsTable reportPackages={[makeReportPackage(1, { timing })]} />);
    expect(screen.getByText(timing)).toBeInTheDocument();
  });

  it("renders Last Submitted and Status as placeholders announced as None", () => {
    render(<ReportsTable reportPackages={[makeReportPackage(1)]} />);
    const noneCells = screen.getAllByLabelText("None");
    expect(noneCells).toHaveLength(2);
    noneCells.forEach((cell) => expect(cell).toHaveTextContent("-"));
  });

  it("links the submission name to the per-package submission page", () => {
    render(<ReportsTable reportPackages={[makeReportPackage(5)]} />);
    fireEvent.click(screen.getByText("Annual Report 5"));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/proponent/projects/42/submission-packages/5",
    });
  });
});
