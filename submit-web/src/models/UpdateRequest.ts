export type UpdateRequest = {
  id: string;
  submission_item_ids: number[];
  note: string;
  created_date: string;
  created_by: string;
  submission_package_id: number;
  active: boolean;
};
