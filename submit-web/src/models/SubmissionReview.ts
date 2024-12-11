export type SubmissionReviewStatus =
  | "PENDING_STAFF_REVIEW"
  | "PENDING_MANAGER_REVIEW"
  | "APPROVED"
  | "REJECTED";
export const SUBMISSION_REVIEW_STATUS = Object.freeze<
  Record<SubmissionReviewStatus, SubmissionReviewStatus>
>({
  PENDING_STAFF_REVIEW: "PENDING_STAFF_REVIEW",
  PENDING_MANAGER_REVIEW: "PENDING_MANAGER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

export type SubmissionReview = {
  id: number;
  item_id: number;
  entries: SubmissionReviewEntry[];
  status: SubmissionReviewStatus;
  active: boolean;
};

export type SubmissionReviewEntryType =
  | "STAFF_RECOMMENDATION"
  | "MANAGER_CONFIRMATION";

export const SUBMISSION_REVIEW_ENTRY_TYPE = Object.freeze<
  Record<SubmissionReviewEntryType, SubmissionReviewEntryType>
>({
  STAFF_RECOMMENDATION: "STAFF_RECOMMENDATION",
  MANAGER_CONFIRMATION: "MANAGER_CONFIRMATION",
});

export type SubmissionReviewEntry = {
  id: number;
  review_id: number;
  type: SubmissionReviewEntryType;
  updated_by: string;
  updated_date: string;
  entry: Record<string, unknown>;
};
