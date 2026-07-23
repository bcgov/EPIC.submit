import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApprovalBanner } from "./ApprovalBanner";

describe("ApprovalBanner", () => {
  it("renders approval message", () => {
    render(<ApprovalBanner contactEmail="test@gov.bc.ca" />);

    expect(
      screen.getByText("Your submission has been approved."),
    ).toBeInTheDocument();
  });

  it("renders contact email as mailto link", () => {
    render(<ApprovalBanner contactEmail="test@gov.bc.ca" />);

    const link = screen.getByRole("link", { name: "test@gov.bc.ca" });
    expect(link).toHaveAttribute("href", "mailto:test@gov.bc.ca");
  });

  it("renders with IPD email", () => {
    render(<ApprovalBanner contactEmail="EAO.emailaddress@gov.bc.ca" />);

    const link = screen.getByRole("link", {
      name: "EAO.emailaddress@gov.bc.ca",
    });
    expect(link).toHaveAttribute(
      "href",
      "mailto:EAO.emailaddress@gov.bc.ca",
    );
  });
});
