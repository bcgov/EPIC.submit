import { Submission, SubmissionStatus } from "@/models/Submission";

export type SubmissionItemTableRow = {
  id: number;
  name: string;
  submitted_by: string;
  status: SubmissionStatus;
  version: number;
  submissions: Array<Submission>;
  has_document: boolean;
  reviewStatus?: string;
};
