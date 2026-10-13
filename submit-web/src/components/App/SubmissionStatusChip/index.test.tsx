import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SubmissionStatusChip } from "./index";

// Expose the theme passed to the shared StatusChip so we can assert the
// one-meaning color system without depending on rendered CSS.
vi.mock("@/components/Shared/StatusChip", () => ({
  StatusChip: ({ label, theme }: { label: string; theme?: string }) => (
    <span data-testid="status-chip" data-theme={theme}>
      {label}
    </span>
  ),
}));

const themeFor = (status: string) => {
  render(<SubmissionStatusChip status={status} />);
  const theme = screen.getByTestId("status-chip").getAttribute("data-theme");
  cleanup();
  return theme;
};

/**
 * The entity "New" badge is the only teal (decision) chip; "New Submission" and
 * "Awaiting Manager Approval" are internal EAO steps and must be purple.
 */
describe("SubmissionStatusChip color system", () => {
  it("maps New Submission to the purple theme", () => {
    expect(themeFor("NEW_SUBMISSION")).toBe("purple");
  });

  it("maps the entity New badge to the teal (decision) theme", () => {
    expect(themeFor("NEW")).toBe("decision");
  });

  it("maps Awaiting Manager Approval to the purple theme", () => {
    expect(themeFor("AWAITING_MANAGER_APPROVAL")).toBe("purple");
  });

  it("maps Updated to the purple theme", () => {
    expect(themeFor("UPDATED")).toBe("purple");
  });

  it("keeps Update Requested on the orange theme", () => {
    expect(themeFor("UPDATE_REQUESTED")).toBe("orange");
  });

  it("renders the resolved label for a status", () => {
    render(<SubmissionStatusChip status="NEW_SUBMISSION" />);
    expect(screen.getByText("New Submission")).toBeInTheDocument();
  });
});
