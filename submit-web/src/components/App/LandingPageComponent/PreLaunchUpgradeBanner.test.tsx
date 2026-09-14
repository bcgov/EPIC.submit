import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreLaunchUpgradeBanner } from "./PreLaunchUpgradeBanner";

describe("PreLaunchUpgradeBanner", () => {
  it("renders the upgrade heading", () => {
    render(<PreLaunchUpgradeBanner />);
    expect(
      screen.getByText("Upgrades are coming to EPIC.submit"),
    ).toBeInTheDocument();
  });

  it("renders the downtime window phrase in bold", () => {
    render(<PreLaunchUpgradeBanner />);
    const boldPhrase = screen.getByText(
      /the site will be unavailable for a few hours on September 22, starting at 7 pm PDT\./i,
    );
    expect(boldPhrase).toBeInTheDocument();
    // The date/time phrase is emphasised via a bold span.
    expect(boldPhrase.tagName.toLowerCase()).toBe("span");
  });

  it("renders the planning guidance on its own line", () => {
    render(<PreLaunchUpgradeBanner />);
    expect(
      screen.getByText("Please plan your submissions around this window."),
    ).toBeInTheDocument();
  });

  it("is not dismissible (no close control)", () => {
    render(<PreLaunchUpgradeBanner />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exposes the banner as an alert region", () => {
    render(<PreLaunchUpgradeBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
