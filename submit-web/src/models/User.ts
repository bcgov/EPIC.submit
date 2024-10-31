import { AccountUser } from "./AccountUser";

export type UserType = "PROPONENT" | "STAFF";
export const USER_TYPE = Object.freeze<Record<UserType, UserType>>({
  PROPONENT: "PROPONENT",
  STAFF: "STAFF",
});
export interface User {
  id: number;
  auth_guid: string;
  account_user: AccountUser;
  type: UserType;
}
