import { Invitation } from "./Invitation";
import { Project } from "./Project";

export type Proponent = {
  id: number;
  name: string;
  invitations?: Invitation[];
  projects?: Project[];
};
