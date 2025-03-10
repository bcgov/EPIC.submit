export type EpicSubmitRole =
  | "eao_edit"
  | "eao_view"
  | "eao_create"
  | "extended_eao_edit"
  | "proponent_create";

export const EPIC_SUBMIT_ROLE = Object.freeze<
  Record<EpicSubmitRole, EpicSubmitRole>
>({
  eao_edit: "eao_edit",
  eao_view: "eao_view",
  eao_create: "eao_create",
  extended_eao_edit: "extended_eao_edit",
  proponent_create: "proponent_create",
});

export enum USER_MANAGEMENT_ROLE {
  PROJECT_ADMIN = "PROJECT_ADMIN",
  SUBMISSION_ADMIN = "SUBMISSION_ADMIN",
  SPECIFIC_SUBMISSION_CONTRIBUTOR = "SPECIFIC_SUBMISSION_CONTRIBUTOR",
}
