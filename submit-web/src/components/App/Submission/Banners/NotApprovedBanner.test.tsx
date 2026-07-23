import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotApprovedBanner } from "./NotApprovedBanner";

describe("NotApprovedBanner", () => {
  const defaultProps = {
    contactEmail: "EAO.ManagementPlanSupport@gov.bc.ca",
    packageTypeName: "Management Plan",
    nextVersion: 2,
  };

  it("renders not approved message with package type name", () => {
    render(<NotApprovedBanner {...defaultProps} />);

    expect(
      screen.getByText(/Your Management Plan has not been approved/),
    ).toBeInTheDocument();
  });

  it("renders next version number", () => {
    render(<NotApprovedBanner {...defaultProps} />);

    expect(screen.getByText(/select Package 2 above/)).toBeInTheDocument();
  });

  it("renders contact email as mailto link", () => {
    render(<NotApprovedBanner {...defaultProps} />);

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
      <NotApprovedBanner {...defaultProps} contactEmail="custom.eao@gov.bc.ca" />,
    );

    const link = screen.getByRole("link", {
      name: "custom.eao@gov.bc.ca",
    });
    expect(link).toHaveAttribute("href", "mailto:custom.eao@gov.bc.ca");
  });

  it("renders with different package type name and version", () => {
    render(
      <NotApprovedBanner
        contactEmail="test@gov.bc.ca"
        packageTypeName="Environmental Plan"
        nextVersion={5}
      />,
    );

    expect(
      screen.getByText(/Your Environmental Plan has not been approved/),
    ).toBeInTheDocument();
    expect(screen.getByText(/select Package 5 above/)).toBeInTheDocument();
  });
});
