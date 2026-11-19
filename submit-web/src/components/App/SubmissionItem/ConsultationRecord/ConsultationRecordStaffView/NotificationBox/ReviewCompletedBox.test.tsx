import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewCompletedNotification } from "./ReviewCompletedBox";
import {
  SUBMISSION_REVIEW_ENTRY_TYPE,
  SUBMISSION_REVIEW_STATUS,
  SubmissionReview,
} from "@/models/SubmissionReview";

// Stub the status chip (depends on the account store) so the test stays
// focused on the ReviewCompletedBox layout and text styling.
vi.mock("@/components/App/SubmissionStatusChip", () => ({
  SubmissionStatusChip: ({ status }: { status?: string }) => (
    <span data-testid="status-chip">{status}</span>
  ),
}));

const BODY_BLACK = "#2d2d2d";

const buildReview = (
  overrides: Partial<SubmissionReview> = {},
): SubmissionReview => ({
  id: 1,
  item_id: 1,
  status: SUBMISSION_REVIEW_STATUS.APPROVED,
  active: true,
  entries: [
    {
      id: 1,
      review_id: 1,
      type: SUBMISSION_REVIEW_ENTRY_TYPE.STAFF_RECOMMENDATION,
      updated_by: "Vanderbeek-Thompson, Alexandra",
      // Legacy responses without an offset still represent UTC.
      updated_date: "2025-01-01T12:00:00",
      entry: {},
    },
    {
      id: 2,
      review_id: 1,
      type: SUBMISSION_REVIEW_ENTRY_TYPE.MANAGER_CONFIRMATION,
      updated_by: "Vanderbeek-Thompson, Benjamin",
      updated_date: "2025-01-03T12:00:00",
      entry: { passedConsultationCheck: "PASSED_CONSULTATION_CHECK" },
    },
  ],
  ...overrides,
});

describe("ReviewCompletedNotification (Consultation Check)", () => {
  it("shows BC dates for review timestamps on either side of midnight", () => {
    const review = buildReview();
    review.entries[0].updated_date = "2026-11-19T06:59:00+00:00";
    review.entries[1].updated_date = "2026-11-19T07:00:00+00:00";
    render(<ReviewCompletedNotification submissionReview={review} />);
    expect(screen.getByText("18-Nov-2026")).toBeInTheDocument();
    expect(screen.getByText("19-Nov-2026")).toBeInTheDocument();
  });

  it("renders both reviewer names and dates", () => {
    render(<ReviewCompletedNotification submissionReview={buildReview()} />);

    expect(
      screen.getByText("Vanderbeek-Thompson, Alexandra"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vanderbeek-Thompson, Benjamin"),
    ).toBeInTheDocument();
    expect(screen.getByText("01-Jan-2025")).toBeInTheDocument();
    expect(screen.getByText("03-Jan-2025")).toBeInTheDocument();
  });

  it("renders banner text in body black rather than green", () => {
    render(<ReviewCompletedNotification submissionReview={buildReview()} />);

    const heading = screen.getByText(
      "The Consultation Check was confirmed as:",
    );
    expect(heading).toHaveStyle({ color: BODY_BLACK });
  });

  it("renders the four aligned columns: label, name, Date label and date", () => {
    render(<ReviewCompletedNotification submissionReview={buildReview()} />);

    expect(screen.getByText("Decision recommended by:")).toBeInTheDocument();
    expect(screen.getByText("Confirmed by:")).toBeInTheDocument();
    expect(screen.getAllByText("Date:")).toHaveLength(2);
  });

  it("keeps reviewer names on a single line via noWrap", () => {
    render(<ReviewCompletedNotification submissionReview={buildReview()} />);

    const name = screen.getByText("Vanderbeek-Thompson, Alexandra");
    // MUI applies the `noWrap` style as white-space: nowrap on the element.
    expect(name).toHaveStyle({ whiteSpace: "nowrap" });
  });
});
