import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusCell } from "./StatusCell";
import { SUBMISSION_STATUS, Submission } from "@/models/Submission";
import { UpdateRequest } from "@/models/UpdateRequest";

// ── Module mocks ────────────────────────────────────────────────────────────

const mockUseAccount = vi.fn();
vi.mock("@/store/accountStore", () => ({
  useAccount: () => mockUseAccount(),
}));

const mockUseIsNewVersion = vi.fn();
vi.mock("@/hooks/useIsNewVersion", () => ({
  useIsNewVersion: (...args: unknown[]) => mockUseIsNewVersion(...args),
}));

vi.mock("@/components/App/SubmissionStatusChip", () => ({
  SubmissionStatusChip: ({ status }: { status: string }) => (
    <span data-testid={`chip-${status}`}>{status}</span>
  ),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const makeSubmission = (overrides: Partial<Submission> = {}): Submission => ({
  id: 1,
  item_id: 10,
  version: "1.2",
  minor_version: 2,
  major_version: 1,
  type: "DOCUMENT",
  created_date: "2024-01-01T00:00:00Z",
  submitted_by: "user-1",
  status: SUBMISSION_STATUS.SUBMITTED,
  is_updated: true,
  ...overrides,
});

const updateRequests: UpdateRequest[] = [
  {
    id: 1,
    submission_item_types: [5],
    reason: "Please update",
    created_date: "2024-01-01",
    created_by: "staff-1",
    submission_package_id: 10,
    active: true,
    type: "UPDATE",
    note: "",
    status: "OPEN",
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("StatusCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("New Version badge", () => {
    it("shows New Version chip for staff when isNewVersion is true", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });
      mockUseIsNewVersion.mockReturnValue(true);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission()}
                  itemTypeId={5}
                  updateRequests={updateRequests}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("chip-NEW_VERSION")).toBeInTheDocument();
    });

    it("shows New Version chip for proponent when isNewVersion is true", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });
      mockUseIsNewVersion.mockReturnValue(true);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission()}
                  itemTypeId={5}
                  updateRequests={updateRequests}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("chip-NEW_VERSION")).toBeInTheDocument();
    });

    it("does not show New Version chip when isNewVersion is false", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission()}
                  itemTypeId={5}
                  updateRequests={updateRequests}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.queryByTestId("chip-NEW_VERSION")).not.toBeInTheDocument();
    });
  });

  describe("Staff-only status chips", () => {
    it("shows FAILED chip for staff when status is REJECTED", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.REJECTED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("chip-FAILED")).toBeInTheDocument();
    });

    it("does not show FAILED chip for proponent when status is REJECTED", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.REJECTED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.queryByTestId("chip-FAILED")).not.toBeInTheDocument();
    });

    it("shows VERIFIED chip for staff when status is VERIFIED", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.VERIFIED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("chip-VERIFIED")).toBeInTheDocument();
    });

    it("does not show VERIFIED chip for proponent when status is VERIFIED", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.VERIFIED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.queryByTestId("chip-VERIFIED")).not.toBeInTheDocument();
    });

    it("shows ACKNOWLEDGED chip for staff when status is ACKNOWLEDGED", () => {
      mockUseAccount.mockReturnValue({ userType: "STAFF" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.ACKNOWLEDGED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.getByTestId("chip-ACKNOWLEDGED")).toBeInTheDocument();
    });

    it("does not show ACKNOWLEDGED chip for proponent when status is ACKNOWLEDGED", () => {
      mockUseAccount.mockReturnValue({ userType: "PROPONENT" });
      mockUseIsNewVersion.mockReturnValue(false);

      render(
        <table>
          <tbody>
            <tr>
              <td>
                <StatusCell
                  submittedDocument={makeSubmission({ status: SUBMISSION_STATUS.ACKNOWLEDGED })}
                />
              </td>
            </tr>
          </tbody>
        </table>,
      );

      expect(screen.queryByTestId("chip-ACKNOWLEDGED")).not.toBeInTheDocument();
    });
  });
});
