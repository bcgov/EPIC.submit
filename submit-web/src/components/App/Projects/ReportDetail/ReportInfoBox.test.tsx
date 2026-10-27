import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectReport } from "@/models/Package";
import { ReportInfoBox } from "./ReportInfoBox";

vi.mock("@/utils/config", () => ({
  AppConfig: { supportMpEmail: "EAO.ManagementPlanSupport@gov.bc.ca" },
}));

const baseReport: ProjectReport = {
  id: 1,
  project_id: 1,
  report_id: 1,
  condition_number: 6,
  condition_subsection: "2",
  report_type: "Compliance Self-Report",
  report_name: "Compliance Self-Report",
  display_name: "Compliance Self-Report",
  phase: "Operations",
  frequency: "Annually",
  timing: "On or before March 31 of each year",
  also_required_in_phases: [],
};

describe("ReportInfoBox", () => {
  it("shows the condition badge with this phase's subsection", () => {
    render(<ReportInfoBox report={baseReport} />);
    expect(screen.getByText("6.2")).toBeInTheDocument();
  });

  it("shows type, phase, frequency and timing", () => {
    render(<ReportInfoBox report={baseReport} />);
    expect(screen.getByText("Compliance Self-Report")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Annually")).toBeInTheDocument();
    expect(
      screen.getByText("On or before March 31 of each year"),
    ).toBeInTheDocument();
  });

  it("lists other phases as plain comma-separated text when present", () => {
    render(
      <ReportInfoBox
        report={{
          ...baseReport,
          also_required_in_phases: ["Pre-Construction", "Construction", "Closure"],
        }}
      />,
    );
    expect(screen.getByText("Also required in:")).toBeInTheDocument();
    expect(
      screen.getByText("Pre-Construction, Construction, Closure"),
    ).toBeInTheDocument();
  });

  it("hides the 'Also required in' row when there are no other phases", () => {
    render(<ReportInfoBox report={baseReport} />);
    expect(screen.queryByText("Also required in:")).not.toBeInTheDocument();
  });

  it("shows the contact-the-EAO line as a mailto link", () => {
    render(<ReportInfoBox report={baseReport} />);
    expect(
      screen.getByText(/If this information is incorrect/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "EAO.ManagementPlanSupport@gov.bc.ca",
    });
    expect(link).toHaveAttribute(
      "href",
      "mailto:EAO.ManagementPlanSupport@gov.bc.ca",
    );
  });

  it("uses border-box sizing so padding/border stay within its width (no overflow)", () => {
    const { container } = render(<ReportInfoBox report={baseReport} />);
    // The outer panel is the first element rendered by the component.
    const outerBox = container.firstElementChild as HTMLElement;
    expect(outerBox).toHaveStyle({
      width: "100%",
      boxSizing: "border-box",
    });
  });
});
