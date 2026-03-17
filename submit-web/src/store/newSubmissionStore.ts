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
  existingIPD: boolean;

  setAccountProject: (accountProject: AccountProject | null) => void;
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
  existingIPD: false,
};

export const useNewSubmissionStore = create<NewSubmissionState>((set) => ({
  ...initialState,
  setAccountProject: (accountProject) => {
    const currentPhase =
      accountProject?.account_project_works?.at(-1)?.work?.current_phase ??
      null;

    const mappedPackages =
      accountProject?.packages
        ?.map((pkg) => ({
          value: pkg.type.name as SubmissionPackageType,
          label: pkg.name,
          id: pkg.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) ?? [];

    const existingIPD = mappedPackages.some(
      (pkg) => pkg.value === SubmissionPackageType.IPD,
    );

    set({ accountProject, currentPhase, mappedPackages, existingIPD });
  },
  setSubmissionPackageType: (submissionPackageType) =>
    set({ submissionPackageType }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
