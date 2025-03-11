import { UserPackageStatus } from "@/components/UserStatusChip";
import { Account } from "./Account";
import { USER_MANAGEMENT_ROLE } from "./Role";

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

export type Role = {
  account_project_id: number | null;
  package_ids: number[];
  role_id: number;
  role_name: USER_MANAGEMENT_ROLE;
};

export type AccountUserWithRole = {
  id: number | null;
  account_id: number;
  first_name?: string;
  last_name?: string;
  full_name: string;
  position?: string;
  work_email_address: string;
  work_contact_number?: string;
  account?: Account;
  status: UserPackageStatus;
  roles: Role[];
  user_id: number | null;
};
