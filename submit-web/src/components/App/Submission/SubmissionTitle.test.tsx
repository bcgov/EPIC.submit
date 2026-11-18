import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmissionPackage } from "@/models/Package";
import { SubmissionTitle } from "./SubmissionTitle";

vi.mock("@/components/Shared/ProjectStatus", () => ({
  ProjectStatus: ({ status }: { status: string }) => <span>{status}</span>,
}));

const makePackage = ({
  typeLabel,
  workLabel,
  phaseName = "Early Engagement",
}: {
  typeLabel?: string | null;
  workLabel?: string | null;
  phaseName?: string;
}) =>
  ({
    id: 1,
    type: { id: 1, name: "IPD", phase_label: typeLabel },
    account_project_work: {
      id: 1,
      work: {
        title: "EAC Assessment",
        phase_label: workLabel,
        current_phase: { id: 1, name: phaseName },
      },
    },
  }) as unknown as SubmissionPackage;

describe("SubmissionTitle status text", () => {
  it("shows the package type phase label first", () => {
    render(
      <SubmissionTitle
        submissionPackage={makePackage({
          typeLabel: "Pre-EA/Early Engagement",
          workLabel: "Other",
        })}
      />,
    );
    expect(
      screen.getByText("Submitting documents for Pre-EA/Early Engagement"),
    ).toBeInTheDocument();
  });

  it("uses the work phase label when the package type has none", () => {
    render(
      <SubmissionTitle
        submissionPackage={makePackage({ workLabel: "Pre-EA" })}
      />,
    );
    expect(
      screen.getByText("Submitting documents for Pre-EA"),
    ).toBeInTheDocument();
  });

  it("falls back to the phase name when no label is configured", () => {
    render(<SubmissionTitle submissionPackage={makePackage({})} />);
    expect(screen.getByText("Early Engagement")).toBeInTheDocument();
  });
});
