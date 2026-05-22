import { AccountProject } from "@/models/Project";
import { SubmissionPackageType } from "@/models/Package";
import { TrackPhase } from "@/models/TrackPhase";
import { create } from "zustand";

interface NewSubmissionState {
  accountProject?: AccountProject | null;
  submissionPackageType: SubmissionPackageType | null;
  currentPhase: TrackPhase | null;
  isLoading: boolean;

  // Computed/derived properties
  mappedPackages: {
    value: SubmissionPackageType;
    label: string;
    id: number;
  }[];

  setAccountProject: (accountProject: AccountProject | null, workId?: number) => void;
  setSubmissionPackageType: (
    submissionPackageType: SubmissionPackageType | null,
  ) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  accountProject: null,
  submissionPackageType: null,
  currentPhase: null,
  isLoading: false,
  mappedPackages: [],
};

export const useNewSubmissionStore = create<NewSubmissionState>((set) => ({
  ...initialState,
  setAccountProject: (accountProject, workId) => {
    // Find the current phase based on workId if provided
    const currentPhase = workId
      ? accountProject?.account_project_works?.find((apw) => apw.id === workId)?.work?.current_phase ?? null
      : accountProject?.account_project_works?.at(-1)?.work?.current_phase ?? null;

    // Filter packages by account_project_work_id to only show packages for the current work
    const mappedPackages =
      accountProject?.packages
        ?.filter((pkg) => pkg.account_project_work?.id === workId)
        ?.map((pkg) => ({
          value: pkg.type.name as SubmissionPackageType,
          label: pkg.name,
          id: pkg.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) ?? [];

    set({ accountProject, currentPhase, mappedPackages });
  },
  setSubmissionPackageType: (submissionPackageType) =>
    set({ submissionPackageType }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
