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

export type UpdateRequest = {
  id: string;
  submission_item_ids: number[];
  note: string;
  created_date: string;
  created_by: string;
  submission_package_id: number;
  active: boolean;
  type: UpdateRequestType;
};
