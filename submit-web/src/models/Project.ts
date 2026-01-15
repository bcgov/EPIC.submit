import { SubmissionPackage } from "./Package";
import { Proponent } from "./Proponent";

export type Project = {
  id: number;
  name: string;
  proponent_id: number;
  proponent?: Proponent;
  ea_certificate?: string;
  epic_guid: string;
};

export const getProjectProponentId = (project: Project): number => {
  return project.proponent_id ?? 0;
};

export type AccountProject = {
  id: number;
  project_id: number;
  account_id: number;
  project: Project;
  packages: SubmissionPackage[];
};

export const createDefaultAccountProject = (): AccountProject => ({
  id: 0,
  project_id: 0,
  account_id: 0,
  project: {
    id: 0,
    name: "",
    proponent_id: 0,
    proponent: undefined,
    epic_guid: "",
  },
  packages: [],
});
