export type EpicSubmitRole =
  | "eao_edit"
  | "eao_view"
  | "eao_create"
  | "extended_eao_edit";

export const EPIC_SUBMIT_ROLE = Object.freeze<
  Record<EpicSubmitRole, EpicSubmitRole>
>({
  eao_edit: "eao_edit",
  eao_view: "eao_view",
  eao_create: "eao_create",
  extended_eao_edit: "extended_eao_edit",
});

export enum USER_MANAGEMENT_ROLE {
  ACCOUNT_PRIMARY_ADMIN = "ACCOUNT_PRIMARY_ADMIN",
  PROJECT_ADMIN = "PROJECT_ADMIN",
  SPECIFIC_PROJECT_ADMIN = "SPECIFIC_PROJECT_ADMIN",
  SUBMISSION_ADMIN = "SUBMISSION_ADMIN",
  SPECIFIC_SUBMISSION_CONTRIBUTOR = "SPECIFIC_SUBMISSION_CONTRIBUTOR",
}

export const roleDetails: Record<
  USER_MANAGEMENT_ROLE,
  { label: string; info: string }
> = {
  [USER_MANAGEMENT_ROLE.ACCOUNT_PRIMARY_ADMIN]: {
    label: "Account Administrator",
    info: "Full access to all submissions for all projects (including creating new submissions and submitting to EAO), manage all users, and system settings",
  },
  [USER_MANAGEMENT_ROLE.PROJECT_ADMIN]: {
    label: "Project Administrator",
    info: "Full access to all submissions (including creating new submissions and submitting to EAO), manage users, and system settings.",
  },
  [USER_MANAGEMENT_ROLE.SPECIFIC_PROJECT_ADMIN]: {
    label: "Project Administrator - Specific Project(s)",
    info: "Full access to all submissions for the selected projects (including creating new submissions and submitting to EAO), manage users (excluding Account Administrators)",
  },
  [USER_MANAGEMENT_ROLE.SUBMISSION_ADMIN]: {
    label: "Collaborator - All Submissions",
    info: "Access all existing submissions to view and contribute.",
  },
  [USER_MANAGEMENT_ROLE.SPECIFIC_SUBMISSION_CONTRIBUTOR]: {
    label: "Collaborator - Specific Submissions",
    info: "Access is limited to specific submissions to view and contribute.",
  },
};

export enum ACCOUNT_USER_PERMISSIONS {
  CREATE_PACKAGE = "CREATE_PACKAGE",
  SUBMIT_PACKAGE = "SUBMIT_PACKAGE",
  INVITE_USERS = "INVITE_USERS",
  TEST = "TEST",
}
