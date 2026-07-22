import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmissionSuccessBox } from "./index";
import { PackageType } from "@/models/Package";

vi.mock("@/utils/config", () => ({
  AppConfig: {
    supportMpEmail: "EAO.ManagementPlanSupport@gov.bc.ca",
    supportIpdEmail: "EAO.emailaddress@gov.bc.ca",
  },
}));

const basePackageType: PackageType = {
  id: 1,
  name: "Management Plan" as any,
  versioning_enabled: true,
  mandatory: false,
  success_message:
    "Your plan has been successfully submitted to the EAO.\nIf you have any questions, please contact the EAO at {{contact_email}}",
};

describe("SubmissionSuccessBox", () => {
  it("renders single paragraph when success_message has no newline", () => {
    const singleLineType: PackageType = {
      ...basePackageType,
      success_message: "Your submission was received.",
    };
    render(<SubmissionSuccessBox submissionPackageType={singleLineType} />);

    expect(
      screen.getByText("Your submission was received."),
    ).toBeInTheDocument();
  });

  it("renders multiple paragraphs when success_message contains newline", () => {
    const multiParagraphType: PackageType = {
      ...basePackageType,
      success_message:
        "Your submission package has been successfully submitted to EAO.\nYou can add or replace documents.",
    };

    render(
      <SubmissionSuccessBox submissionPackageType={multiParagraphType} />,
    );

    expect(
      screen.getByText(
        "Your submission package has been successfully submitted to EAO.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can add or replace documents."),
    ).toBeInTheDocument();
  });

  it("renders default MP email when contactEmail prop is not provided and message has placeholder", () => {
    render(<SubmissionSuccessBox submissionPackageType={basePackageType} />);

    const link = screen.getByRole("link", {
      name: "EAO.ManagementPlanSupport@gov.bc.ca",
    });
    expect(link).toHaveAttribute(
      "href",
      "mailto:EAO.ManagementPlanSupport@gov.bc.ca",
    );
  });

  it("renders custom email when contactEmail prop is provided", () => {
    render(
      <SubmissionSuccessBox
        submissionPackageType={basePackageType}
        contactEmail="custom@gov.bc.ca"
      />,
    );

    const link = screen.getByRole("link", { name: "custom@gov.bc.ca" });
    expect(link).toHaveAttribute("href", "mailto:custom@gov.bc.ca");
  });

  it("renders nothing when success_message is undefined", () => {
    const noMessageType: PackageType = {
      ...basePackageType,
      success_message: undefined,
    };

    const { container } = render(
      <SubmissionSuccessBox submissionPackageType={noMessageType} />,
    );

    // Should render the container box but no Typography elements inside
    const typographies = container.querySelectorAll("p");
    expect(typographies.length).toBe(0);
  });

  it("renders text without link when message has no placeholder", () => {
    const noPlaceholderType: PackageType = {
      ...basePackageType,
      success_message: "Simple message with no email.",
    };

    render(
      <SubmissionSuccessBox submissionPackageType={noPlaceholderType} />,
    );

    expect(
      screen.getByText("Simple message with no email."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
