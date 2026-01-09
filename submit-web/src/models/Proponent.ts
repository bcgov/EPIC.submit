import { Invitation } from "./Invitation";
import { AccountProject, Project } from "./Project";

export type ProponentStatus = "ELIGIBLE" | "INELIGIBLE" | "PENDING_ONBOARDING" | "ONBOARDED";

export type Proponent = {
  id: number;
  proponent_id: number;
  name: string;
  status?: ProponentStatus | null;
  is_deleted: boolean;
  invitations?: Invitation[];
  projects?: Project[];
  account_projects?: AccountProject[];
};
