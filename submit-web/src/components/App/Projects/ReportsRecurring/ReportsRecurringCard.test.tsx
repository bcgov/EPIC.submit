import { describe, it, expect, vi, beforeEach } from "vitest";
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
    render(<ReportsRecurringCard projectId={1} reportPackages={[]} />);
    expect(screen.getByText(REPORTS_EMPTY_STATE_MESSAGE)).toBeInTheDocument();
  });

  it("renders All Phases without a collapse toggle button", () => {
    render(
      <ReportsRecurringCard
        projectId={1}
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
        projectId={1}
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
        projectId={1}
        reportPackages={[makeReportPackage(1, "Construction", 3)]}
      />,
    );
    expect(screen.queryByText(/Closure/)).not.toBeInTheDocument();
  });

  describe("remembering expanded phases", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    const constructionToggle = () =>
      screen.getByRole("button", {
        name: "Construction, 1 report/notification",
      });

    const packages = [
      makeReportPackage(1, ALL_PHASES, 7),
      makeReportPackage(2, "Construction", 3),
    ];

    it("keeps an expanded phase expanded after the card remounts", () => {
      const { unmount } = render(
        <ReportsRecurringCard projectId={101} reportPackages={packages} />,
      );
      fireEvent.click(constructionToggle());
      unmount();

      render(<ReportsRecurringCard projectId={101} reportPackages={packages} />);
      expect(constructionToggle()).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps a re-collapsed phase collapsed after the card remounts", () => {
      const { unmount } = render(
        <ReportsRecurringCard projectId={102} reportPackages={packages} />,
      );
      fireEvent.click(constructionToggle());
      fireEvent.click(constructionToggle());
      unmount();

      render(<ReportsRecurringCard projectId={102} reportPackages={packages} />);
      expect(constructionToggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("remembers expanded phases separately for each project", () => {
      const { unmount } = render(
        <ReportsRecurringCard projectId={103} reportPackages={packages} />,
      );
      fireEvent.click(constructionToggle());
      unmount();

      render(<ReportsRecurringCard projectId={104} reportPackages={packages} />);
      expect(constructionToggle()).toHaveAttribute("aria-expanded", "false");
    });

    it("restores expanded phases after a full page reload", async () => {
      const { unmount } = render(
        <ReportsRecurringCard projectId={105} reportPackages={packages} />,
      );
      fireEvent.click(constructionToggle());
      unmount();

      // Simulate a reload: drop in-memory module state, keep localStorage.
      vi.resetModules();
      const { ReportsRecurringCard: ReloadedCard } = await import(
        "./ReportsRecurringCard"
      );
      render(<ReloadedCard projectId={105} reportPackages={packages} />);
      expect(constructionToggle()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
