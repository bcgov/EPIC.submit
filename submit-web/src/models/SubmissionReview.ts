// PENDING_STAFF_REVIEW = 'PENDING_STAFF_REVIEW'
// PENDING_MANAGER_REVIEW = 'PENDING_MANAGER_REVIEW'
// APPROVED = 'APPROVED'
// REJECTED = 'REJECTED'

type SubmissionReviewStatus =
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
  form_answers: Record<string, unknown>;
  status: string;
  active: boolean;
};
