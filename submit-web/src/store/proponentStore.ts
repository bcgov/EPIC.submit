import { Invitation, InvitationStatus } from "@/models/Invitation";
import { Project } from "@/models/Project";
import { Proponent } from "@/models/Proponent";
import { create } from "zustand";

interface ProponentState {
  proponent: Proponent | null;
  selectedProjectsIds: (string | number)[];
  isLoading: boolean;
  isError: boolean;
  
  // Computed/derived properties
  onboardedProjects: Project[];
  eligibleProjects: Project[];
  pendingInvitation: Invitation | undefined;
  
  // Actions
  setProponent: (proponent: Proponent | null) => void;
  setSelectedProjectsIds: (ids: (string | number)[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsError: (error: boolean) => void;
  reset: () => void;
}

const initialState = {
  proponent: null,
  selectedProjectsIds: [],
  isLoading: false,
  isError: false,
  pendingInvitation: undefined,
  onboardedProjects: [],
  eligibleProjects: [],
};

export const useProponentStore = create<ProponentState>((set, get) => ({
  ...initialState,
  
  setProponent: (proponent) => {
    set({ proponent });
    
    if (proponent) {
      // Ideally there is only 1 pending invitation per proponent, but just in case we grab the most recent pending invite.
      const pendingInvitation = proponent.invitations
        ?.filter((invitation) => invitation.status === InvitationStatus.PENDING)
        .sort(
          (a, b) =>
            new Date(b.expiry_date).getTime() - new Date(a.expiry_date).getTime(),
        )[0];  

      const accountProjectIds = new Set(
        proponent.account_projects?.map(ap => ap.project_id) || []
      );

      const onboardedProjects = (proponent.projects || [])
        .filter(project => accountProjectIds.has(project.id))
        .sort((a, b) => a.name.localeCompare(b.name));

      const eligibleProjects = proponent.status != "ONBOARDED" 
      ? proponent.projects 
      : (proponent.projects || [])
        .filter(project => !accountProjectIds.has(project.id))
        .sort((a, b) => a.name.localeCompare(b.name));

      set({ pendingInvitation, onboardedProjects, eligibleProjects });
    } else {
      set({ onboardedProjects: [], eligibleProjects: [] });
    }
  },
  
  setSelectedProjectsIds: (selectedProjectsIds) => set({ selectedProjectsIds }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsError: (isError) => set({ isError }),
  reset: () => set(initialState),
}));