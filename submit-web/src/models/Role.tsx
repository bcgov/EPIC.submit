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
