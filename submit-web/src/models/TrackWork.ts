import { TrackPhase } from "./TrackPhase";

export type TrackWork = {
  id: number;
  project_id: number;
  current_phase_id?: number;
  work_state?: string;
  title?: string;
  contact_email?: string;
  current_phase?: TrackPhase;
};

export enum WORK_TYPE_NAMES {
  AMENDMENT = "AMENDMENT",
  ASSESSMENT = "ASSESSMENT",
  CEAOS_DESIGNATION = "CEAOS_DESIGNATION",
  EAC_EXTENSION = "INVITE_USERS",
  EAC_ORDER_TRANSFER = "EAC_ORDER_TRANSFER",
  EXEMPTION_ORDER = "EXEMPTION_ORDER",
  MATERIAL_ALTERATION = "MATERIAL_ALTERATION",
  MINISTERS_DESIGNATION = "MINISTERS_DESIGNATION",
  PROJECT_NOTIFICATION = "PROJECT_NOTIFICATION",
  SUBSTANTIAL_START_DETERMINATION = "SUBSTANTIAL_START_DETERMINATION",
}
