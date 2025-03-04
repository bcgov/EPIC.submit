export const defaultUseQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5,
  retry: false,
};

export const QUERY_KEY = Object.freeze({
  ACCOUNT_PROJECTS: "projects/accounts",
  ACCOUNT_PROJECT: "account-project",
  SUBMISSION_PACKAGE: "package",
  ACCOUNT_USER: "user",
  SUBMISSION_ITEM: "item",
  PROJECTS: "projects",
  SUBMISSIONS: "submissions",
  USERS: "users",
  PACKAGE_VERSIONS: "package-versions",
  STAFF_USER: "staff/staff-user",
  ACTIVITY_LOGS: "activity-logs",
  SUBMISSION_VERSIONS: "submission-versions",
  ACCOUNT_USERS: "account-users",
});
