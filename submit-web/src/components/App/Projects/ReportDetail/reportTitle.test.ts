import { describe, it, expect } from "vitest";
import { ProjectReport } from "@/models/Package";
import { formatReportPageTitle } from "./reportTitle";

const report = (overrides: Partial<ProjectReport>): ProjectReport =>
  (({
    id: 1,
    project_id: 1,
    report_id: 1,
    ...overrides
  }) as ProjectReport);

describe("formatReportPageTitle", () => {
  it("formats as '[name]: [phase]'", () => {
    expect(
      formatReportPageTitle(
        report({ display_name: "Compliance Self-Report", phase: "Construction" }),
      ),
    ).toBe("Compliance Self-Report: Construction");
  });

  it("handles the All Phases phase", () => {
    expect(
      formatReportPageTitle(
        report({ display_name: "Compliance Notification", phase: "All Phases" }),
      ),
    ).toBe("Compliance Notification: All Phases");
  });

  it("falls back to report_type when display_name is missing", () => {
    expect(
      formatReportPageTitle(
        report({ report_type: "Annual Report", phase: "Operations" }),
      ),
    ).toBe("Annual Report: Operations");
  });

  it("returns an empty string for a missing report", () => {
    expect(formatReportPageTitle(null)).toBe("");
  });
});
