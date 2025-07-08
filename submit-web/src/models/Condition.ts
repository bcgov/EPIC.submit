export type Condition = {
  condition_attributes?: ConditionAttribute;
  condition_name: string | null;
  plan_name: string | null;
  condition_number: number | null;
  condition_text: string | null;
};

export type ConditionAttribute = {
  deliverable_name: string;
  milestone_related_to_plan_submission: string;
  parties_required_to_be_consulted: string;
  requires_consultation: string;
  requires_management_plan: string;
  requires_iem_terms_of_engagement: string;
  submitted_to_eao_for: string;
  time_associated_with_submission_milestone: string;
};
export type ConditionsLibraryResponse = {
  conditions: Condition[];
};
