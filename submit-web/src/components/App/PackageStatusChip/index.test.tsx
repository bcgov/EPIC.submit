import { describe, it, expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PackageStatus, NonCanonicalPackageStatus } from "@/models/Package";
import PackageStatusChip from "./index";

// Expose the theme passed to the shared StatusChip so we can assert the
// one-meaning color system without depending on rendered CSS.
vi.mock("@/components/Shared/StatusChip", () => ({
  StatusChip: ({ label, theme }: { label: string; theme?: string }) => (
    <span data-testid="status-chip" data-theme={theme}>
      {label}
    </span>
  ),
}));

const themeFor = (status: PackageStatus | NonCanonicalPackageStatus) => {
  render(<PackageStatusChip status={status} />);
  const theme = screen.getByTestId("status-chip").getAttribute("data-theme");
  cleanup();
  return theme;
};

describe("PackageStatusChip color system", () => {
  it.each([
    "NEW_SUBMISSION",
    "RESUBMITTED",
    "UPDATED",
    "AWAITING_MANAGER_APPROVAL",
    "PENDING_ACKNOWLEDGEMENT",
    "READY_FOR_APPROVAL",
  ] as const)("maps %s to the purple theme", (status) => {
    expect(themeFor(status)).toBe("purple");
  });

  it("maps the entity New badge to the teal (decision) theme", () => {
    expect(themeFor("NEW")).toBe("decision");
  });

  it("maps In Progress to the yellow (warning) family", () => {
    expect(themeFor("IN_PROGRESS")).toBe("warning");
  });

  it("maps Withdrawn to the yellow (warning) family", () => {
    expect(themeFor("WITHDRAWN")).toBe("warning");
  });

  it.each([
    "UPDATE_REQUESTED",
    "REVISION_REQUIRED",
    "REVISION_REQUESTED",
  ] as const)("keeps %s on the orange theme for holder action", (status) => {
    expect(themeFor(status)).toBe("orange");
  });

  it("renders the resolved label for a status", () => {
    render(<PackageStatusChip status="RESUBMITTED" />);
    expect(screen.getByText("Resubmitted")).toBeInTheDocument();
  });
});
