// NonCanonicalSubmissionStatus are just for display purpose, they are not canonical business statuses
export type NonCanonicalSubmissionStatus =
  | "ACCEPTED"

export const NON_CANONICAL_UPDATE_REQUEST_STATUS = Object.freeze<
  Record<NonCanonicalSubmissionStatus, NonCanonicalSubmissionStatus>
>({
  ACCEPTED: "ACCEPTED",
});

export type UpdateRequestType = "UPDATE" | "REVIEW";

export const UPDATE_REQUEST_TYPE = Object.freeze<
  Record<UpdateRequestType, { value: UpdateRequestType; label: string }>
>({
  UPDATE: {
    value: "UPDATE",
    label: "Update",
  },
  REVIEW: {
    value: "REVIEW",
    label: "Revision Required",
  },
});

export type UpdateRequestStatus = "OPEN" | "PENDING_REVIEW" | "CLOSED" | "ACCEPTED";
export const UPDATE_REQUEST_STATUS = Object.freeze<
  Record<UpdateRequestStatus, { value: UpdateRequestStatus; label: string }>
>({
  OPEN: {
    value: "OPEN",
    label: "Open",
  },
  PENDING_REVIEW: {
    value: "PENDING_REVIEW",
    label: "Pending Review",
  },
  CLOSED: {
    value: "CLOSED",
    label: "Closed",
  },
  ACCEPTED: {
    value: "ACCEPTED",
    label: "Accepted",
  },
});
export type UpdateRequest = {
  id: number;
  submission_item_types: number[];
  reason: string;
  created_date: string;
  created_by: string;
  submission_package_id: number;
  active: boolean;
  type: UpdateRequestType;
  note: string;
  status: UpdateRequestStatus;
};
