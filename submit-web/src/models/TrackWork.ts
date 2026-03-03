import { TrackPhase } from "./TrackPhase";

export type TrackWork = {
  id: number;
  project_id: number;
  current_phase_id?: number;
  work_state?: string;
  title?: string;
  current_phase?: TrackPhase;
};
