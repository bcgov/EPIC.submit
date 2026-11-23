import { TrackWork } from "./TrackWork";

export type AccountProjectWork = {
  id: number;
  work_id: number;
  work: TrackWork;
  /** True once any package of this work has been archived because the work moved to a later phase. */
  has_archived_packages?: boolean;
};
