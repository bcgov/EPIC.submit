import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StaffSubmissionItemTableRow from "./index";
import { SubmissionItem, SubmissionItemMethod, SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import { PackageType } from "@/models/Package";

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ projectId: "1", submissionPackageId: "10" }),
}));

const mockUseHasRole = vi.fn();
vi.mock("@/hooks/common", () => ({
  useHasRole: (...args: unknown[]) => mockUseHasRole(...args),
}));

const mockUsePackageRoles = vi.fn();
vi.mock("@/hooks/usePackageRoles", () => ({
  usePackageRoles: (...args: unknown[]) => mockUsePackageRoles(...args),
}));

const mockUseContactInfoAlwaysEditable = vi.fn();
vi.mock("@/hooks/useContactInfoAlwaysEditable", () => ({
  useContactInfoAlwaysEditable: (...args: unknown[]) =>
    mockUseContactInfoAlwaysEditable(...args),
}));

// useSuspenseQuery is used to fetch the submission package
const mockUseSuspenseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: (...args: unknown[]) => mockUseSuspenseQuery(...args),
}));

vi.mock("@/hooks/api/usePackages", () => ({
  getStaffSubmissionPackageQueryOptions: vi.fn(() => ({})),
}));

// Render DocumentRow as a no-op to keep tests focused
vi.mock("@/components/App/Submission/DocumentRow", () => ({
  default: () => null,
}));

// SubmissionItemReviewConfirmation just passes onClick through to children
vi.mock("@/components/App/Submission/SubmissionItemReviewConfirmation", () => ({
  default: ({ children, onClick }: { children: React.ReactElement; onClick: () => void }) => (
    <span onClick={onClick}>{children}</span>
  ),
}));

vi.mock("@/components/App/Projects/ProjectTable/EmptyRow", () => ({
  default: () => null,
}));

vi.mock("@/components/Shared/Table/common", () => ({
  SubmitPrimaryRowTableCell: ({ children }: { children?: React.ReactNode }) => <td>{children}</td>,
  SubmitTablePrimaryRow: ({ children }: { children?: React.ReactNode }) => <tr>{children}</tr>,
}));

vi.mock("@/components/App/SubmissionStatusChip", () => ({
  SubmissionStatusChipStack: () => null,
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const makePackage = (statuses: string[]) => ({
  id: 10,
  status: statuses,
  submitted_on: "2024-01-01T00:00:00Z",
  account_project_work: null,
});

const makeItem = (method = SubmissionItemMethod.DOCUMENT_UPLOAD): SubmissionItem => ({
  id: 1,
  package_id: 10,
  sort_order: 1,
  status: "SUBMITTED",
  submitted_by: "user-1",
  submitted_on: "2024-01-01T00:00:00Z",
  type: {
    id: 5,
    name: SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN,
    submission_method: method,
  },
  type_id: 5,
  version: 1,
  submissions: [],
});

const defaultPackageType = { id: 1, name: "Management Plan" } as unknown as PackageType;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps the component in a minimal table structure so MUI table cells render without warnings.
 */
function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StaffSubmissionItemTableRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user has the package create role
    mockUseHasRole.mockReturnValue(true);
    mockUsePackageRoles.mockReturnValue({ create: "mp_create", edit: "mp_edit" });
    // Default: item is not the always-editable contact information item
    mockUseContactInfoAlwaysEditable.mockReturnValue(false);
  });

  describe("Request Update visibility", () => {
    it("shows Request Update when package has no end status", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["IN_REVIEW"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("Request Update")).toBeInTheDocument();
    });

    it("hides Request Update when package status is REVIEW_REJECTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["REVIEW_REJECTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });

    it("hides Request Update when package status is APPROVED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["APPROVED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });

    it("hides Request Update when package status is ACCEPTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["ACCEPTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });

    it("hides Request Update when package status is NOT_APPROVED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["NOT_APPROVED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });

    it("hides Request Update when package status is REJECTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["REJECTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });

    it("hides Request Update when package status is REVISION_REQUESTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["REVISION_REQUESTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Request Update")).not.toBeInTheDocument();
    });
  });

  describe("Review action visibility", () => {
    it("shows Review link when package has no end status and was submitted", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["IN_REVIEW"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("shows Review link when package status is REVIEW_REJECTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["REVIEW_REJECTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("hides Review link when package status is APPROVED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["APPROVED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Review")).not.toBeInTheDocument();
    });

    it("shows View link (not Review) for form-submission items without end status", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["IN_REVIEW"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem(SubmissionItemMethod.FORM_SUBMISSION)}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("View")).toBeInTheDocument();
      expect(screen.queryByText("Review")).not.toBeInTheDocument();
    });

    it("shows View link for form-submission items when package is REVIEW_REJECTED", () => {
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["REVIEW_REJECTED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeItem(SubmissionItemMethod.FORM_SUBMISSION)}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("View")).toBeInTheDocument();
    });
  });

  describe("Contact information edit link (EAO)", () => {
    const makeContactItem = () => ({
      ...makeItem(SubmissionItemMethod.FORM_SUBMISSION),
      type: {
        id: 1,
        name: SUBMISSION_ITEM_TYPE.CONTACT_INFORMATION,
        submission_method: SubmissionItemMethod.FORM_SUBMISSION,
      },
    });

    it("shows Edit link for contact info on latest version when staff has edit role", () => {
      mockUseContactInfoAlwaysEditable.mockReturnValue(true);
      mockUseHasRole.mockReturnValue(true);
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["APPROVED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeContactItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("hides Edit link when staff lacks the edit role", () => {
      mockUseContactInfoAlwaysEditable.mockReturnValue(true);
      mockUseHasRole.mockReturnValue(false);
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["APPROVED"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeContactItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });

    it("does not show Edit link when the item is not always-editable contact info", () => {
      mockUseContactInfoAlwaysEditable.mockReturnValue(false);
      mockUseHasRole.mockReturnValue(true);
      mockUseSuspenseQuery.mockReturnValue({
        data: makePackage(["IN_REVIEW"]),
        isPending: false,
      });

      renderInTable(
        <StaffSubmissionItemTableRow
          item={makeContactItem()}
          packageType={defaultPackageType}
          onRequestUpdate={vi.fn()}
        />,
      );

      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });
});
