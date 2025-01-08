export type Subcondition = {
  subcondition_identifier: string;
  subcondition_text: string;
  subconditions: Subcondition[];
};

export type Condition = {
  amendment_names: string | null;
  condition_attributes: string[];
  condition_id: string;
  condition_name: string | null;
  condition_number: number | null;
  condition_text: string | null;
  is_approved: boolean;
  subconditions: Subcondition[];
  subtopic_tags: string[] | null;
  topic_tags: string[] | null;
  year_issued: number;
};

export type ConditionsLibraryResponse = {
  conditions: Condition[];
  document_category: string;
  document_category_id: string;
  document_label: string;
  project_name: string;
};
