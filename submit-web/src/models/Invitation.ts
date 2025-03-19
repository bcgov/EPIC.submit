import { Role } from "./AccountUser";

export enum InvitationStatus {
  PENDING = "pending",
  USED = "used",
  REVOKED = "revoked",
}

export type Invitation = {
  id: number;
  account_id: number;
  project_ids: number[];
  token: string;
  email: string;
  status: string;
  expiry_date: string;
  created_date: string;
  is_first_time: boolean;
  role: Role;
};
