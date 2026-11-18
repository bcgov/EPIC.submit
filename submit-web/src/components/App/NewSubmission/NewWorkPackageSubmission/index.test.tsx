import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewWorkPackageSubmission } from ".";

const mockStore = vi.fn();
vi.mock("@/store/newSubmissionStore", () => ({
  useNewSubmissionStore: () => mockStore(),
}));

vi.mock("../NewSubmissionCard", () => ({
  NewSubmissionCard: ({
    status,
    children,
  }: {
    status?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <span data-testid="status">{status ?? "none"}</span>
      {children}
    </div>
  ),
}));

vi.mock("./NewWorkPackageSubmissionForm", () => ({
  NewWorkPackageSubmissionForm: () => <div data-testid="form" />,
}));

describe("NewWorkPackageSubmission", () => {
  beforeEach(() => {
    mockStore.mockReset();
  });

  it("tells the proponent which phase the documents are for", () => {
    mockStore.mockReturnValue({
      accountProject: null,
      currentPhase: { id: 1, name: "Early Engagement" },
      currentPhaseLabel: "Pre-EA/Early Engagement",
    });
    render(<NewWorkPackageSubmission onSubmit={vi.fn()} />);
    expect(screen.getByTestId("status")).toHaveTextContent(
      "Submitting documents for Pre-EA/Early Engagement",
    );
    expect(screen.getByTestId("form")).toBeInTheDocument();
  });

  it("shows no status when the phase has no label", () => {
    mockStore.mockReturnValue({
      accountProject: null,
      currentPhase: { id: 1, name: "Early Engagement" },
      currentPhaseLabel: null,
    });
    render(<NewWorkPackageSubmission onSubmit={vi.fn()} />);
    expect(screen.getByTestId("status")).toHaveTextContent("none");
  });
});
