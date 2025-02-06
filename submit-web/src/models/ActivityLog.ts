export type ActivityLogEntityType = "PACKAGE";

export const ACTIVITY_LOG_ENTITY_TYPE: Record<
  ActivityLogEntityType,
  ActivityLogEntityType
> = {
  PACKAGE: "PACKAGE",
};

export type AcitivityLog = {
  id: number;
  entity_type: string;
  entity_id: number;
  entity_version: number;
  action: string;
  actor_id: number;
  activity_at: string;
};
