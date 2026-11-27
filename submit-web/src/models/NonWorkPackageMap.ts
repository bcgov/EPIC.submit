/**
 * A non-work package map (e.g. Management Plan, Report) a project is eligible for.
 * Labels come from the database so the UI never hard-codes them.
 */
export type NonWorkPackageMap = {
  id: number;
  code: string;
  work_label: string;
  phase_label: string;
  sort_order: number;
};
