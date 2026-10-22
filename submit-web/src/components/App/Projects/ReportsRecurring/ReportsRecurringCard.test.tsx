import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubmissionPackage } from "@/models/Package";
import { ReportsRecurringCard } from "./ReportsRecurringCard";
import { ALL_PHASES, REPORTS_EMPTY_STATE_MESSAGE } from "./constants";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

const makeReportPackage = (
  id: number,
  phase: string,
  conditionNumber: number,
): SubmissionPackage =>
  ({
    id,
    name: `Package ${id}`,
    status: [],
    type_id: 1,
    type: { id: 1, name: "Report", versioning_enabled: false, mandatory: false },
    items: [],
    account_project_id: 1,
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
      phase,
      condition_number: conditionNumber,
      frequency: "Annually",
      timing: "Within 30 days",
      display_name: `Report ${id}`,
    },
  }) as unknown as SubmissionPackage;

describe("ReportsRecurringCard", () => {
  it("shows the empty state when there are no obligations", () => {
    render(<ReportsRecurringCard reportPackages={[]} />);
    expect(screen.getByText(REPORTS_EMPTY_STATE_MESSAGE)).toBeInTheDocument();
  });

  it("renders All Phases without a collapse toggle button", () => {
    render(
      <ReportsRecurringCard
        reportPackages={[makeReportPackage(1, ALL_PHASES, 7)]}
      />,
    );
    // No phase-group toggle button should exist for an All Phases only list.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Report 1")).toBeInTheDocument();
  });

  it("renders other phase groups as accessible toggle buttons that expand", async () => {
    render(
      <ReportsRecurringCard
        reportPackages={[
          makeReportPackage(1, ALL_PHASES, 7),
          makeReportPackage(2, "Construction", 3),
        ]}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: "Construction, 1 report/notification",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Report 2")).toBeInTheDocument();
  });

  it("does not render a group for a phase with no obligations", () => {
    render(
      <ReportsRecurringCard
        reportPackages={[makeReportPackage(1, "Construction", 3)]}
      />,
    );
    expect(screen.queryByText(/Closure/)).not.toBeInTheDocument();
  });
});
