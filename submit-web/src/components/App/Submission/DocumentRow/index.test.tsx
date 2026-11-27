import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import DocumentRow from "./index";
import { SUBMISSION_STATUS, Submission } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SubmissionPackage } from "@/models/Package";

// ── Module mocks ────────────────────────────────────────────────────────────

const mockUseDocumentRow = vi.fn();
vi.mock("@/hooks/useDocumentRow", () => ({
  useDocumentRow: (...args: unknown[]) => mockUseDocumentRow(...args),
}));

vi.mock("@/hooks/usePackageRoles", () => ({
  usePackageRoles: () => ({ edit: "edit" }),
}));

vi.mock("@/hooks/common", () => ({
  useHasRole: () => true,
}));

vi.mock("@/hooks/api/useGeo", () => ({
  useGetGeoUploads: () => ({ data: [] }),
}));

vi.mock("@/components/Shared/PermissionGate", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/App/Submission/SubmissionItemReviewConfirmation", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/App/Submission/ItemsTable/DocumentsSubTable", () => ({
  default: () => null,
}));

vi.mock("@/components/Shared/DocumentLink", () => ({
  DocumentLink: ({ name }: { name: string }) => <span>{name}</span>,
}));

vi.mock("@/components/Shared/GeoApprovedBadge", () => ({
  GeoApprovedBadge: () => null,
}));

vi.mock("@/components/App/Map/MapPreviewModal", () => ({
  MapPreviewModal: () => null,
}));

vi.mock("./StatusCell", () => ({
  StatusCell: () => null,
}));

vi.mock("./ActionButton", () => ({
  ActionButton: () => null,
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const makeSubmission = (isVirusRejected: boolean): Submission =>
  ({
    id: 1,
    item_id: 10,
    version: "1.1",
    minor_version: 1,
    major_version: 1,
    type: "DOCUMENT",
    created_date: "2024-01-01T00:00:00Z",
    submitted_by: "user-1",
    status: SUBMISSION_STATUS.SUBMITTED,
    is_updated: false,
    sort_order: 0,
    submitted_document: {
      id: 5,
      name: "report.pdf",
      url: "bucket/report.pdf",
      folder: "",
      is_virus_rejected: isVirusRejected,
    },
  }) as Submission;

const submissionItem = {
  id: 10,
  type: { name: "Management Plan" },
} as unknown as SubmissionItem;

const submissionPackage = {
  id: 3,
  account_project_work: { id: 7 },
} as unknown as SubmissionPackage;

const renderRow = (documentSubmission: Submission) =>
  render(
    <table>
      <tbody>
        <DocumentRow
          documentSubmission={documentSubmission}
          submissionItem={submissionItem}
          submissionPackage={submissionPackage}
          staff
        />
      </tbody>
    </table>,
  );

// ── Tests ───────────────────────────────────────────────────────────────────

describe("DocumentRow Verify button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDocumentRow.mockReturnValue({
      pendingGetObject: false,
      expanded: false,
      setExpanded: vi.fn(),
      isPackageReadyForAcknowledgement: false,
      isAdditionalInfo: false,
      isNewVersion: false,
      showUndoVerificationButton: false,
      showDefaultActionButton: false,
      handleVerify: vi.fn(),
      handleUndoVerification: vi.fn(),
      openDocument: vi.fn(),
    });
  });

  it("offers Verify to staff for a submitted document", () => {
    renderRow(makeSubmission(false));

    expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
  });

  it("does not offer Verify for a document the virus scan rejected", () => {
    renderRow(makeSubmission(true));

    expect(screen.queryByRole("button", { name: "Verify" })).toBeNull();
  });
});
