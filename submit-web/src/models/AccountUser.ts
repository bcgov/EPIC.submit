import { UserPackageStatus } from "@/components/App/UserStatusChip";
import { Account } from "./Account";
import { USER_MANAGEMENT_ROLE } from "./Role";

export type Role = {
  account_project_id: number | null;
  account_user_id: number;
  package_ids: number[];
  original_package_ids: number[];
  package_names: string[];
  role_id: number;
  role_name: USER_MANAGEMENT_ROLE;
  permissions: string[];
};

export type AccountUser = {
  id: number;
  account_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  work_email_address: string;
  work_contact_number: string;
  company_name: string;
  account: Account;
  roles: Role[];
  has_agreed_to_terms: boolean;
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
  extension_number?: string;
  company_name?: string;
  account?: Account;
  status: UserPackageStatus;
  roles: Role[];
  invitation_id: number;
  user_id: number | null;
};
