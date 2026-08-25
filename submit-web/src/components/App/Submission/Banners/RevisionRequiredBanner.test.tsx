import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevisionRequiredBanner } from "./RevisionRequiredBanner";

describe("RevisionRequiredBanner", () => {
  it("renders revision required message", () => {
    render(
      <RevisionRequiredBanner contactEmail="EAO.ManagementPlanSupport@gov.bc.ca" />,
    );

    expect(
      screen.getByText("Your plan requires revisions."),
    ).toBeInTheDocument();
  });

  it("renders contact email as mailto link", () => {
    render(
      <RevisionRequiredBanner contactEmail="EAO.ManagementPlanSupport@gov.bc.ca" />,
    );

    const link = screen.getByRole("link", {
      name: "EAO.ManagementPlanSupport@gov.bc.ca",
    });
    expect(link).toHaveAttribute(
      "href",
      "mailto:EAO.ManagementPlanSupport@gov.bc.ca",
    );
  });

  it("renders with custom work contact email", () => {
    render(
      <RevisionRequiredBanner contactEmail="custom.eao@gov.bc.ca" />,
    );

    const link = screen.getByRole("link", {
      name: "custom.eao@gov.bc.ca",
    });
    expect(link).toHaveAttribute("href", "mailto:custom.eao@gov.bc.ca");
  });

  it("renders decision letter text when showDecisionLetterText is true", () => {
    render(
      <RevisionRequiredBanner
        contactEmail="EAO.ManagementPlanSupport@gov.bc.ca"
        showDecisionLetterText={true}
      />,
    );

    expect(
      screen.getByText(
        /Please refer to the decision letter from the EAO\./,
      ),
    ).toBeInTheDocument();
  });

  it("does not render decision letter text when showDecisionLetterText is false", () => {
    render(
      <RevisionRequiredBanner
        contactEmail="EAO.ManagementPlanSupport@gov.bc.ca"
        showDecisionLetterText={false}
      />,
    );

    expect(
      screen.queryByText(
        /Please refer to the decision letter from the EAO\./,
      ),
    ).not.toBeInTheDocument();
  });

  it("does not render decision letter text by default", () => {
    render(
      <RevisionRequiredBanner contactEmail="EAO.ManagementPlanSupport@gov.bc.ca" />,
    );

    expect(
      screen.queryByText(
        /Please refer to the decision letter from the EAO\./,
      ),
    ).not.toBeInTheDocument();
  });
});
