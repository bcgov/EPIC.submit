export const defaultUseQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5,
};

export const QUERY_KEY = Object.freeze({
  ACCOUNT_PROJECTS: "projects/accounts",
  ACCOUNT_PROJECT: "account-project",
  SUBMISSION_PACKAGE: "package",
  STAFF_SUBMISSION_PACKAGE: "staff/package",
  ACCOUNT_USER: "user",
  SUBMISSION_ITEM: "item",
  PROJECTS: "projects",
  SUBMISSIONS: "submissions",
  USERS: "users",
  STAFF_ACCOUNT_PROJECTS: "staff/account-projects",
});
