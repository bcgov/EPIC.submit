import { Role } from "./AccountUser";

export enum InvitationStatus {
  PENDING = "PENDING",
  USED = "USED",
  REVOKED = "REVOKED",
}

export type Invitation = {
  id: number;
  account_id: number;
  /** @deprecated Use eligible_entries instead */
  project_ids?: number[];
  eligible_entries?: Array<{
    project_id: number;
    work_ids?: number[];
    non_work_item_types?: string[];
  }>;
  token: string;
  email: string;
  status: string;
  expiry_date: string;
  is_expired: boolean;
  created_date: string;
  is_first_time: boolean;
  role: Role;
  proponent_id: number;
};
