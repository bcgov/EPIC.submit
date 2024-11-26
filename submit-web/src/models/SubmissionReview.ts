export type SubmissionReview = {
  id: number;
  item_id: number;
  form_answers: Record<string, unknown>;
  status: string;
  active: boolean;
};
