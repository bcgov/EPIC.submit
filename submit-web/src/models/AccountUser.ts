import { Account } from "./Account";

export type AccountUser = {
  id: number;
  account_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  work_email_address: string;
  work_contact_number: string;
  auth_guid: string;
  account: Account;
};
