export type StatusFilterRole = "eao" | "proponent";

export type StatusEntry<T extends string = string> = {
  value: T;
  label: string;
  // Which filter UIs this status appears in
  filter?: StatusFilterRole[];
  // Groups multiple statuses under a single display option, e.g. "Completed"
  sortOrder?: number;
  isGroup?: boolean;
};

// Shared grouping definition: any status whose value appears here gets
// collapsed into a single display option (keyed by label) in the filter UI.
export const FILTER_GROUPS: Record<string, { label: string }> = {
  REVIEWED: { label: "Completed" },
  ACCEPTED: { label: "Completed" },
  SATISFIED: { label: "Completed" },
  APPROVED: { label: "Completed" },
  COMPLETED: { label: "Completed" },
};

// Expand group entries back into the concrete status values
export const expandStatusFilters = (statuses: string[]): string[] => {
  return statuses.flatMap((s) => {
    const groupLabel = FILTER_GROUPS[s]?.label;
    if (!groupLabel) return [s];
    return Object.keys(FILTER_GROUPS).filter(
      (key) => FILTER_GROUPS[key]?.label === groupLabel,
    );
  });
};

// Builds a role-scoped subset of a status map.
export const buildRoleFilters = <T extends string>(
  statusMap: Record<T, StatusEntry<T>>,
  role: StatusFilterRole,
): Partial<Record<T, StatusEntry<T>>> =>
  Object.fromEntries(
    Object.entries(statusMap).filter(([, entry]) =>
      (entry as StatusEntry<T>).filter?.includes(role),
    ),
  ) as Partial<Record<T, StatusEntry<T>>>;
