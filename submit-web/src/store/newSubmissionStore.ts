import { AccountProject } from "@/models/Project";
import { SubmissionPackageType } from "@/models/Package";
import { TrackPhase } from "@/models/TrackPhase";
import { create } from "zustand";

interface NewSubmissionState {
  accountProject?: AccountProject | null;
  submissionType: SubmissionPackageType | null;
  currentPhase: TrackPhase | null;
  isLoading: boolean;

  setAccountProject: (accountProject: AccountProject | null) => void;
  setSubmissionType: (submissionType: SubmissionPackageType | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  accountProject: null,
  submissionType: null,
  currentPhase: null,
  isLoading: false,
};

export const useNewSubmissionStore = create<NewSubmissionState>((set) => ({
  ...initialState,
  setAccountProject: (accountProject) => {
    const currentPhase =
      accountProject?.account_project_works?.at(-1)?.work?.current_phase ??
      null;
    set({ accountProject, currentPhase });
  },
  setSubmissionType: (submissionType) => set({ submissionType }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
