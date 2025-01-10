export type Condition = {
  condition_attributes?: ConditionAttribute;
  condition_name: string | null;
  condition_number: number | null;
  condition_text: string | null;
};

export type ConditionAttribute = {
  parties_required_to_be_consulted: string;
  deliverable_name: string;
  fn_consultation_required: string;
};

export type ConditionsLibraryResponse = {
  conditions: Condition[];
};
