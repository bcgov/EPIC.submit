import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmissionPackage } from "@/models/Package";
import { PackageStatusChipStack } from "./PackageStatusChipStack";

const makePackage = (status: string[]) =>
  ({ status }) as unknown as SubmissionPackage;

describe("PackageStatusChipStack", () => {
  it("shows Ready for Acknowledgement on its own, without Verified or Pending Acknowledgement", () => {
    render(
      <PackageStatusChipStack
        submissionPackage={makePackage(["READY_FOR_ACKNOWLEDGEMENT"])}
      />,
    );

    expect(screen.getByText("Ready for Acknowledgement")).toBeInTheDocument();
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Acknowledgement")).not.toBeInTheDocument();
  });

  it.each([
    ["UPDATE_REQUESTED", "Update Requested"],
    ["UPDATED", "Updated"],
  ])("never hides the %s overlay next to Ready for Acknowledgement", (overlay, label) => {
    render(
      <PackageStatusChipStack
        submissionPackage={makePackage(["READY_FOR_ACKNOWLEDGEMENT", overlay])}
      />,
    );

    expect(screen.getByText("Ready for Acknowledgement")).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows Acknowledged with Ready for Approval after the package is acknowledged", () => {
    render(
      <PackageStatusChipStack
        submissionPackage={makePackage(["ACKNOWLEDGED", "READY_FOR_APPROVAL"])}
      />,
    );

    expect(screen.getByText("Acknowledged")).toBeInTheDocument();
    expect(screen.getByText("Ready for Approval")).toBeInTheDocument();
    expect(
      screen.queryByText("Ready for Acknowledgement"),
    ).not.toBeInTheDocument();
  });
});
