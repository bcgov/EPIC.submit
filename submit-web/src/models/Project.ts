import { SubmissionPackage } from "./Package";

export type Project = {
  id: number;
  name: string;
  proponent_id: number;
  proponent_name: string;
  ea_certificate?: string;
  epic_guid: string;
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
    proponent_name: "",
    epic_guid: "",
  },
  packages: [],
});
