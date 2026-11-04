import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionPackage } from "@/models/Package";
import { ReportSubmissionsTable } from "./ReportSubmissionsTable";

vi.mock("@/components/Shared/Table/utils", () => ({
  getObjectFromS3: vi.fn(),
}));

// Grant the edit permission so the staff Verify button renders.
vi.mock("@/store/accountStore", () => ({
  useAccount: () => ({ roles: ["eao_edit"] }),
}));

// Capture what the Verify modal is opened with.
const setOpenSpy = vi.fn();
vi.mock("@/components/Shared/Modals/modalStore", () => ({
  useModal: () => ({ setOpen: setOpenSpy, setClose: vi.fn() }),
}));

// The verify/acknowledge hooks are exercised in their own tests; here we only
// assert wiring.
const verifySpy = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/useReportDocumentVerify", () => ({
  useReportDocumentVerify: () => ({ verify: verifySpy, isVerifying: false }),
}));

const acknowledgeSpy = vi.fn().mockResolvedValue(undefined);
vi.mock("@/hooks/useReportDocumentAcknowledge", () => ({
  useReportDocumentAcknowledge: () => ({
    acknowledge: acknowledgeSpy,
    isAcknowledging: false,
  }),
}));

const makeDocSubmission = (
  id: number,
  name: string,
  createdDate: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id,
  item_id: 1,
  version: "1",
  minor_version: 1,
  major_version: 1,
  type: "DOCUMENT",
  submitted_document: {
    id,
    name,
    url: `s3/${name}`,
    folder: "reports",
    is_virus_rejected: false,
  },
  created_date: createdDate,
  submitted_by: "Jane Doe",
  status: "SUBMITTED",
  is_updated: false,
  ...overrides,
});

const makePackage = (
  submissions: Record<string, unknown>[],
  reportType = "Monitoring/Technical Report",
  phase = "Construction",
): SubmissionPackage =>
  ({
    id: 1,
    name: "Report",
    status: [],
    type_id: 1,
    type: { id: 1, name: "Report", versioning_enabled: false, mandatory: false },
    project_report: { report_type: reportType, phase },
    items: submissions.length
      ? [{ id: 1, type: { id: 1, name: "Upload Files/Documents" }, submissions }]
      : [],
    account_project_id: 1,
    update_requests: [],
    all_update_requests: [],
  }) as unknown as SubmissionPackage;

describe("ReportSubmissionsTable", () => {
  beforeEach(() => {
    setOpenSpy.mockClear();
    verifySpy.mockClear();
    acknowledgeSpy.mockClear();
  });

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

    const link = screen.getByText(fullName);
    expect(link).toHaveAttribute("aria-label", fullName);
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the status badge for the staff audience", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
  });

  it("adds an Actions column with a Verify button for an unverified staff document", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeInTheDocument();
  });

  it("has no Actions column for the proponent audience", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="proponent" />);

    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /verify/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the Verify button for an already-verified staff document", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z", {
        status: "VERIFIED",
      }),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /verify/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the Verify button for an EAO-uploaded staff document", () => {
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z", {
        is_eao_uploaded: true,
      }),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(
      screen.queryByRole("button", { name: /verify/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the Verify modal when the Verify button is clicked", async () => {
    const user = userEvent.setup();
    const pkg = makePackage([
      makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z"),
    ]);
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    await user.click(screen.getByRole("button", { name: /verify/i }));
    expect(setOpenSpy).toHaveBeenCalledTimes(1);
  });

  it("still shows the empty-state row for the staff audience when there are no documents", () => {
    render(
      <ReportSubmissionsTable reportPackage={makePackage([])} audience="staff" />,
    );
    expect(
      screen.getByText("No documents have been submitted yet."),
    ).toBeInTheDocument();
  });

  it("shows Acknowledge for a verified Compliance Self-Report main report", () => {
    const pkg = makePackage(
      [
        makeDocSubmission(1, "CSR_2026.pdf", "2026-06-01T00:00:00Z", {
          status: "VERIFIED",
        }),
      ],
      "Compliance Self-Report",
    );
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(
      screen.getByRole("button", { name: /acknowledge/i }),
    ).toBeInTheDocument();
    // Verify and Acknowledge are mutually exclusive per row.
    expect(
      screen.queryByRole("button", { name: /^verify$/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show Acknowledge for a verified non-Compliance report", () => {
    const pkg = makePackage(
      [
        makeDocSubmission(1, "report.pdf", "2026-06-01T00:00:00Z", {
          status: "VERIFIED",
        }),
      ],
      "Monitoring/Technical Report",
    );
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(
      screen.queryByRole("button", { name: /acknowledge/i }),
    ).not.toBeInTheDocument();
  });

  it("does not show Acknowledge for a verified supporting document", () => {
    const pkg = makePackage(
      [
        makeDocSubmission(1, "appendix.xlsx", "2026-06-01T00:00:00Z", {
          status: "VERIFIED",
          submitted_document: {
            id: 1,
            name: "appendix.xlsx",
            url: "s3/appendix.xlsx",
            folder: "report_supporting_documents",
            is_virus_rejected: false,
          },
        }),
      ],
      "Compliance Self-Report",
    );
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(
      screen.queryByRole("button", { name: /acknowledge/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the Acknowledge modal when the Acknowledge button is clicked", async () => {
    const user = userEvent.setup();
    const pkg = makePackage(
      [
        makeDocSubmission(1, "CSR_2026.pdf", "2026-06-01T00:00:00Z", {
          status: "VERIFIED",
        }),
      ],
      "Compliance Self-Report",
    );
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    await user.click(screen.getByRole("button", { name: /acknowledge/i }));
    expect(setOpenSpy).toHaveBeenCalledTimes(1);
  });

  it("shows the Acknowledged status with no action button for an acknowledged document", () => {
    const pkg = makePackage(
      [
        makeDocSubmission(1, "CSR_2026.pdf", "2026-06-01T00:00:00Z", {
          status: "ACKNOWLEDGED",
        }),
      ],
      "Compliance Self-Report",
    );
    render(<ReportSubmissionsTable reportPackage={pkg} audience="staff" />);

    expect(screen.getByText("Acknowledged")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /acknowledge/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^verify$/i }),
    ).not.toBeInTheDocument();
  });
});
