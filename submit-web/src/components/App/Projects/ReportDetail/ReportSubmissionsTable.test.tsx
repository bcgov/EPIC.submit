import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmissionPackage } from "@/models/Package";
import { ReportSubmissionsTable } from "./ReportSubmissionsTable";

vi.mock("@/components/Shared/Table/utils", () => ({
  getObjectFromS3: vi.fn(),
}));

const makeDocSubmission = (
  id: number,
  name: string,
  createdDate: string,
): Record<string, unknown> => ({
  id,
  item_id: 1,
  version: "1",
  minor_version: 1,
  major_version: 1,
  type: "DOCUMENT",
  submitted_document: { id, name, url: `s3/${name}`, folder: "", is_virus_rejected: false },
  created_date: createdDate,
  submitted_by: "Jane Doe",
  status: "SUBMITTED",
  is_updated: false,
});

const makePackage = (submissions: Record<string, unknown>[]): SubmissionPackage =>
  ({
    id: 1,
    name: "Report",
    status: [],
    type_id: 1,
    type: { id: 1, name: "Report", versioning_enabled: false, mandatory: false },
    items: submissions.length
      ? [{ id: 1, type: { id: 1, name: "Upload Files/Documents" }, submissions }]
      : [],
    account_project_id: 1,
    update_requests: [],
    all_update_requests: [],
  }) as unknown as SubmissionPackage;

describe("ReportSubmissionsTable", () => {
  it("shows the empty-state row when there are no submissions", () => {
    render(<ReportSubmissionsTable reportPackage={makePackage([])} />);
    expect(
      screen.getByText("No documents have been submitted yet."),
    ).toBeInTheDocument();
  });

  it("renders one row per document, newest first", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "older.pdf", "2026-01-01T00:00:00Z"),
      makeDocSubmission(2, "newer.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} />);

    const links = screen.getAllByText(/\.pdf$/);
    expect(links.map((l) => l.textContent)).toEqual(["newer.pdf", "older.pdf"]);
  });

  it("exposes the full document name for screen readers and renders a status badge", () => {
    const fullName = "a-very-long-report-file-name.pdf";
    const pkg = makePackage([
      makeDocSubmission(1, fullName, "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} />);

    // The link text carries an aria-label with the full name for screen readers.
    const link = screen.getByText(fullName);
    expect(link).toHaveAttribute("aria-label", fullName);
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("leaves the Status column empty for the staff audience", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    // Document is listed, but no status badge is rendered (verify story owns it).
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Submitted")).not.toBeInTheDocument();
  });

  it("still shows the empty-state row for the staff audience when there are no documents", () => {
    render(
      <ReportSubmissionsTable reportPackage={makePackage([])} audience="staff" />,
    );
    expect(
      screen.getByText("No documents have been submitted yet."),
    ).toBeInTheDocument();
  });
});
