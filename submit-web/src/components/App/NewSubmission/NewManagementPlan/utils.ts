import { Condition } from "@/models/Condition";

export const getManagementPlanName = (condition?: Condition) => {
  // Conditions now provides the plan header in plan_name. Keep the old attribute
  // fallback so Submit and Conditions can be released separately.
  return (
    condition?.plan_name ??
    condition?.condition_attributes?.deliverable_name?.[0] ??
    condition?.condition_name ??
    ""
  );
};
