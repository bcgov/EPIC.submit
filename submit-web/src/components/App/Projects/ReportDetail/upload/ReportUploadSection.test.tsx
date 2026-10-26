import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportUploadSection, StagedFile } from "./ReportUploadSection";

const makeStaged = (id: string, name: string): StagedFile => ({
  id,
  file: new File(["x"], name, { type: "application/pdf" }),
});

const baseProps = {
  heading: "Upload Report",
  description: "Must be unlocked PDF document (i.e., not password protected).",
  acceptedFileTypes: ["pdf"],
  uploadedByName: "Sarah Nguyen",
  files: [] as StagedFile[],
  onAddFiles: vi.fn(),
  onRemoveFile: vi.fn(),
};

describe("ReportUploadSection", () => {
  it("renders the heading, description and accepted-types caption", () => {
    render(<ReportUploadSection {...baseProps} />);
    expect(screen.getByText("Upload Report")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Must be unlocked PDF document (i.e., not password protected).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Accepted file types: pdf. Max file size: 500 MB."),
    ).toBeInTheDocument();
  });

  it("lists staged files with name, uploaded-by and a Remove action", () => {
    render(
      <ReportUploadSection
        {...baseProps}
        files={[makeStaged("1", "report.pdf")]}
      />,
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Sarah Nguyen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("calls onRemoveFile when Remove is clicked", () => {
    const onRemoveFile = vi.fn();
    render(
      <ReportUploadSection
        {...baseProps}
        files={[makeStaged("abc", "report.pdf")]}
        onRemoveFile={onRemoveFile}
      />,
    );
    screen.getByRole("button", { name: "Remove" }).click();
    expect(onRemoveFile).toHaveBeenCalledWith("abc");
  });

  it("shows the required error when error is set", () => {
    render(<ReportUploadSection {...baseProps} error />);
    expect(screen.getByText("Please upload a document.")).toBeInTheDocument();
  });

  it("does not show the required error by default", () => {
    render(<ReportUploadSection {...baseProps} />);
    expect(
      screen.queryByText("Please upload a document."),
    ).not.toBeInTheDocument();
  });
});
