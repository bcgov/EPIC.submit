import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevisionRequiredBanner } from "./RevisionRequiredBanner";

vi.mock("@/utils/config", () => ({
  AppConfig: {
    supportMpEmail: "EAO.ManagementPlanSupport@gov.bc.ca",
  },
}));

describe("RevisionRequiredBanner", () => {
  it("renders revision required message", () => {
    render(<RevisionRequiredBanner />);

    expect(
      screen.getByText("Your plan requires revisions."),
    ).toBeInTheDocument();
  });

  it("renders MP support email as mailto link", () => {
    render(<RevisionRequiredBanner />);

    const link = screen.getByRole("link", {
      name: "EAO.ManagementPlanSupport@gov.bc.ca",
    });
    expect(link).toHaveAttribute(
      "href",
      "mailto:EAO.ManagementPlanSupport@gov.bc.ca",
    );
  });
});
