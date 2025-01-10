import { Condition } from "@/models/Condition";

export type NewMPFormDataFieldData<T> = {
  label: string;
  value: T;
};
export type NewMPFormData = {
  main_condition?: Condition;
  supporting_conditions?: NewMPFormDataFieldData<number[] | Condition[]>;
};

export type NewManagementPlanForm = {
  name: NewMPFormDataFieldData<string>;
  [otherFields: string]: NewMPFormDataFieldData<
    number | number[] | string | string[]
  >;
};
