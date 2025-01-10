import { Condition } from "@/models/Condition";

export type NewMPFormDataFieldData<T> = {
  label: string;
  value: T;
};
export type NewMPFormData = {
  main_condition: Condition;
  supporting_conditions?: Condition[];
};

export type NewManagementPlanForm = {
  name: NewMPFormDataFieldData<string>;
  main_condition: Condition;
  supporting_conditions?: Condition[];
};
