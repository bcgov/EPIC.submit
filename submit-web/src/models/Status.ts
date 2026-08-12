export type StatusFilterRole = "eao" | "proponent";

export type StatusEntry<T extends string = string> = {
  value: T;
  label: string;
  // Which filter UIs this status appears in
  filter?: StatusFilterRole[];
  sortOrder?: number;
};

export type FilterGroup = {
  label: string;
  // Concrete backend-recognized values this group expands to
  values: string[];
};

const GROUPS = {
  reviewCompleted: {
    label: "Review Completed",
    values: ["REVIEWED", "ACCEPTED", "SATISFIED", "APPROVED"],
  },
} satisfies Record<string, FilterGroup>;

// Non-canonical keys that resolve to a group but have no backend value
const SYNTHETIC_GROUP_KEYS: Record<string, keyof typeof GROUPS> = {
  REVIEW_COMPLETED: "reviewCompleted",
};

export const FILTER_GROUPS: Record<string, FilterGroup> = (() => {
  const map: Record<string, FilterGroup> = {};
  for (const group of Object.values(GROUPS)) {
    for (const value of group.values) map[value] = group;
  }
  for (const [key, groupKey] of Object.entries(SYNTHETIC_GROUP_KEYS)) {
    map[key] = GROUPS[groupKey];
  }
  return map;
})();

// Expand a group's selected filter value into its concrete member values
export const expandStatusFilters = (statuses: string[]): string[] =>
  statuses.flatMap((s) => FILTER_GROUPS[s]?.values ?? [s]);

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
