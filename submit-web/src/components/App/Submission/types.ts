import { Submission, SubmissionItemStatus } from "@/models/Submission";

export type SubmissionItemTableRow = {
  id: number;
  name: string;
  submitted_by: string;
  status: SubmissionItemStatus;
  version: number;
  submissions: Array<Submission>;
  has_document: boolean;
  reviewStatus?: string;
  review_start_date?: string;
  isUpdateRequest?: boolean;
  isRevisionRequired?: boolean;
};
