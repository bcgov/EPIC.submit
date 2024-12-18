import { AccountUser } from "./AccountUser";

export type UserType = "PROPONENT" | "STAFF";
export const USER_TYPE = Object.freeze<Record<UserType, UserType>>({
  PROPONENT: "PROPONENT",
  STAFF: "STAFF",
});

export type StaffUser = {
  id: number;
  first_name: string;
  last_name: string;
  work_email_address: string;
  user_id: number;
};

export interface User {
  id: number;
  auth_guid: string;
  account_user: AccountUser;
  staff_user: StaffUser;
  type: UserType;
}
