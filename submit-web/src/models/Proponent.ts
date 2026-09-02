import { Invitation } from "./Invitation";
import { AccountProject, Project } from "./Project";

export type ProponentAdministrator = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string | null;
  position: string;
  work_contact_number: string;
  work_email_address: string;
};

export type NonCanonicalProponentStatus = "INVITE_EXPIRED";
export type ProponentStatus = "ELIGIBLE" | "INELIGIBLE" | "INVITE_GENERATED" | "PENDING_ONBOARDING" | "ONBOARDED";
export type ProponentStatusFilterOptions = ProponentStatus | NonCanonicalProponentStatus

export type Proponent = {
  id: number;
  name: string;
  status?: ProponentStatus | NonCanonicalProponentStatus | null;
  is_deleted: boolean;
  invitations?: Invitation[];
  projects?: Project[];
  account_projects?: AccountProject[];
  administrators?: ProponentAdministrator[];
};
