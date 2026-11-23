import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { USER_TYPE } from "@/models/User";
import { ProjectSubmissionsCard } from "./ProjectSubmissionsCard";

const mockUseAccount = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: () => mockUseAccount(),
}));

vi.mock("@/components/Shared/PermissionGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/App/Projects/ProjectTable", () => ({
  default: () => <div data-testid="project-table" />,
}));

vi.mock("@/components/App/Submission/SubmissionTitle", () => ({
  SubmissionTitle: () => <div data-testid="submission-title" />,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const renderCard = (
  props: Partial<React.ComponentProps<typeof ProjectSubmissionsCard>> = {},
) =>
  render(
    <ProjectSubmissionsCard
      title="Assessment"
      status="Early Engagement"
      packages={[]}
      isWorkRelated
      workId={1}
      onNewSubmission={vi.fn()}
      {...props}
    />,
  );

describe("ProjectSubmissionsCard phase banners", () => {
  beforeEach(() => {
    mockUseAccount.mockReturnValue({ userType: USER_TYPE.PROPONENT });
  });

  it("shows no banners when the work is in its phase and nothing was archived", () => {
    renderCard();
    expect(
      screen.queryByTestId("awaiting-phase-banner"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("archived-documents-banner"),
    ).not.toBeInTheDocument();
  });

  it("shows the yellow banner for a work that is only in the start phase", () => {
    renderCard({ awaitingPhaseName: "Readiness Decision" });
    expect(screen.getByTestId("awaiting-phase-banner")).toHaveTextContent(
      "Your project is not in Readiness Decision yet.",
    );
  });

  it("shows the proponent blue banner once packages were archived, with no open package", () => {
    renderCard({ hasArchivedPackages: true, packages: [] });
    expect(screen.getByTestId("archived-documents-banner")).toHaveTextContent(
      "Documents you submitted for previous phases are now in the Documents tab.",
    );
  });

  it("shows the staff wording to staff users", () => {
    mockUseAccount.mockReturnValue({ userType: USER_TYPE.STAFF });
    renderCard({ hasArchivedPackages: true });
    expect(screen.getByTestId("archived-documents-banner")).toHaveTextContent(
      "Documents submitted for previous phases are now in the Documents tab.",
    );
  });

  it("does not show banners on the management plan card", () => {
    renderCard({
      isWorkRelated: false,
      awaitingPhaseName: "Readiness Decision",
      hasArchivedPackages: true,
    });
    expect(
      screen.queryByTestId("awaiting-phase-banner"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("archived-documents-banner"),
    ).not.toBeInTheDocument();
  });
});
