import { TrackWork } from "./TrackWork";

export type WorkRole = "TEAM_LEAD" | "TEAM_MEMBER";

export type AccountProjectWork = {
  id: number;
  work_id: number;
  work: TrackWork;
  work_role?: WorkRole;
};
