import { Invitation } from "./Invitation";
import { AccountProject, Project } from "./Project";

export type ProponentStatus = "Eligible" | "Ineligible" | "Pending Onboarding" | "Onboarded";

export type Proponent = {
  id: number;
  proponent_id: number;
  name: string;
  status: ProponentStatus;
  is_deleted: boolean;
  invitations?: Invitation[];
  projects?: Project[];
  account_projects?: AccountProject[];
};
