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

export type UpdateRequestStatus = "OPEN" | "PENDING_REVIEW" | "CLOSED";
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
});
export type UpdateRequest = {
  id: number;
  submission_item_ids: number[];
  reason: string;
  created_date: string;
  created_by: string;
  submission_package_id: number;
  active: boolean;
  type: UpdateRequestType;
  note: string;
  status: UpdateRequestStatus;
};
