import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportDocumentUploadForm } from "./ReportDocumentUploadForm";
import type { AccountProject } from "@/models/Project";
import type { ProjectReport } from "@/models/Package";

// Keep the page chrome light; this test is about the form behaviour.
vi.mock("@/components/Shared/PageGrid", () => ({
  PageGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Shared/Layouts/ContentBox", () => ({
  ContentBox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/App/Submission/SubmissionTitle", () => ({
  SubmissionTitle: () => <div data-testid="submission-title" />,
}));

// A stand-in upload section: one button adds a file, files and the error render as text.
vi.mock("./ReportUploadSection", () => ({
  ReportUploadSection: ({
    heading,
    files,
    onAddFiles,
    onRemoveFile,
    error,
  }: {
    heading: string;
    files: { id: string; file: File }[];
    onAddFiles: (files: File[]) => void;
    onRemoveFile: (id: string) => void;
    error?: boolean;
  }) => (
    <section aria-label={heading}>
      <button
        onClick={() =>
          onAddFiles([new File(["x"], `${heading}.pdf`, { type: "application/pdf" })])
        }
      >
        add to {heading}
      </button>
      {files.map((staged) => (
        <div key={staged.id}>
          <span>{staged.file.name}</span>
          <button onClick={() => onRemoveFile(staged.id)}>
            remove {staged.file.name}
          </button>
        </div>
      ))}
      {error && <p>Please upload a document.</p>}
    </section>
  ),
}));

const accountProject = {
  id: 7,
  project: {
    name: "Cariboo Gold Project",
    proponent: { name: "Osisko Development Corp." },
    ea_certificate: "E23-01",
  },
} as unknown as AccountProject;

const report = {
  report_type: "Compliance Self-Report",
  display_name: "Compliance Self-Report",
  phase: "Construction",
} as unknown as ProjectReport;

const renderForm = (overrides: Partial<Parameters<typeof ReportDocumentUploadForm>[0]> = {}) => {
  const props = {
    accountProject,
    report,
    uploadedByName: "Jordan Lee",
    submitLabel: "Add Documents",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<ReportDocumentUploadForm {...props} />);
  return props;
};

describe("ReportDocumentUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the supplied label on the final button", () => {
    renderForm({ submitLabel: "Add Documents" });
    expect(screen.getByRole("button", { name: "Add Documents" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit to EAO" })).not.toBeInTheDocument();
  });

  it("renders content passed before the upload sections", () => {
    renderForm({ beforeSections: <div>Date Received field</div> });
    expect(screen.getByText("Date Received field")).toBeInTheDocument();
  });

  it("shows the required message and does not submit without a primary file", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    expect(screen.getByText("Please upload a document.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not require a supporting document", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submission = onSubmit.mock.calls[0][0];
    expect(submission.primaryFiles).toHaveLength(1);
    expect(submission.supportingFiles).toHaveLength(0);
  });

  it("passes primary and supporting files to onSubmit", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(
      screen.getByRole("button", { name: "add to Upload Supporting Documents" }),
    );
    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submission = onSubmit.mock.calls[0][0];
    expect(submission.primaryFiles[0].file.name).toBe("Upload Report.pdf");
    expect(submission.supportingFiles[0].file.name).toBe(
      "Upload Supporting Documents.pdf",
    );
  });

  it("stops before submitting when extra validation fails", async () => {
    const user = userEvent.setup();
    const validate = vi.fn().mockReturnValue(false);
    const { onSubmit } = renderForm({ validate });

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    expect(validate).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("removes a staged file", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    expect(screen.getByText("Upload Report.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "remove Upload Report.pdf" }));

    expect(screen.queryByText("Upload Report.pdf")).not.toBeInTheDocument();
  });

  it("keeps the files listed after submitting so a failed save can be retried", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    await user.click(screen.getByRole("button", { name: "add to Upload Report" }));
    await user.click(screen.getByRole("button", { name: "Add Documents" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByText("Upload Report.pdf")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
