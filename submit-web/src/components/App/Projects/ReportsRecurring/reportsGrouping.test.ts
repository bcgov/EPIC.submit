import { describe, it, expect } from "vitest";
import { SubmissionPackage } from "@/models/Package";
import { groupReportsByPhase, buildGroupCountAriaLabel } from "./reportsGrouping";
import { ALL_PHASES } from "./constants";

const makeReportPackage = (
  id: number,
  phase: string | null,
  conditionNumber: number | null,
  conditionSubsection: string | null = null,
): SubmissionPackage =>
  ({
    id,
    name: `Report ${id}`,
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
      condition_subsection: conditionSubsection,
      display_name: `Report ${id}`,
    },
  }) as unknown as SubmissionPackage;

describe("groupReportsByPhase", () => {
  it("orders groups with All Phases first, then the canonical phase order", () => {
    const groups = groupReportsByPhase([
      makeReportPackage(1, "Operations", 5),
      makeReportPackage(2, ALL_PHASES, 1),
      makeReportPackage(3, "Construction", 3),
    ]);

    expect(groups.map((g) => g.phase)).toEqual([
      ALL_PHASES,
      "Construction",
      "Operations",
    ]);
    expect(groups[0].isAlwaysExpanded).toBe(true);
    expect(groups[1].isAlwaysExpanded).toBe(false);
  });

  it("omits phases that have no obligations", () => {
    const groups = groupReportsByPhase([makeReportPackage(1, "Closure", 2)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBe("Closure");
  });

  it("sorts rows within a group numerically by condition number then subsection", () => {
    const groups = groupReportsByPhase([
      makeReportPackage(1, "Construction", 19, "4"),
      makeReportPackage(2, "Construction", 6, "2"),
      makeReportPackage(3, "Construction", 13, "4"),
    ]);

    const conditionNumbers = groups[0].packages.map(
      (p) => p.project_report?.condition_number,
    );
    expect(conditionNumbers).toEqual([6, 13, 19]);
  });

  it("buckets obligations without a phase into All Phases", () => {
    const groups = groupReportsByPhase([makeReportPackage(1, null, 7)]);
    expect(groups[0].phase).toBe(ALL_PHASES);
  });
});

describe("buildGroupCountAriaLabel", () => {
  it("uses the plural noun for multiple obligations", () => {
    expect(buildGroupCountAriaLabel("Construction", 5)).toBe(
      "Construction, 5 reports/notifications",
    );
  });

  it("uses the singular noun for a single obligation", () => {
    expect(buildGroupCountAriaLabel("Closure", 1)).toBe(
      "Closure, 1 report/notification",
    );
  });
});
