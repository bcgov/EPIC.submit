import { Invitation } from "./Invitation";
import { AccountProject, Project } from "./Project";

export type Proponent = {
  id: number;
  name: string;
  invitations?: Invitation[];
  projects?: Project[];
  account_projects?: AccountProject[];
};
