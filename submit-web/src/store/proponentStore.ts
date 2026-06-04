import { Invitation, InvitationStatus } from "@/models/Invitation";
import { Proponent } from "@/models/Proponent";
import { create } from "zustand";

export interface EligibilityEntry {
  id: string; // Created in frontend: "projectId:work:workId" or "projectId:non_work:TYPE"
  project_id: number;
  project_name: string;
  work_id?: number;
  non_work_item_type?: string;
  current_work: string;
  current_phase: string;
  is_onboarded: boolean; // Whether project is onboarded
  is_enabled: boolean; // Whether this specific entry is enabled
}

interface ProponentState {
  proponent: Proponent | null;
  selectedEntryIds: string[];
  isLoading: boolean;
  isError: boolean;

  // Computed/derived properties
  onboardedEntries: EligibilityEntry[];
  eligibleEntries: EligibilityEntry[];
  pendingInvitation: Invitation | undefined;

  // Actions
  setProponent: (proponent: Proponent | null) => void;
  setSelectedEntryIds: (ids: string[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsError: (error: boolean) => void;
  reset: () => void;
}

const initialState = {
  proponent: null,
  selectedEntryIds: [],
  isLoading: false,
  isError: false,
  pendingInvitation: undefined,
  onboardedEntries: [],
  eligibleEntries: [],
};

export const useProponentStore = create<ProponentState>((set) => ({
  ...initialState,

  setProponent: (proponent) => {
    set({ proponent });

    if (proponent) {
      // Ideally there is only 1 pending invitation per proponent, but just in case we grab the most recent pending invite.
      const pendingInvitation =
        proponent.status == "ONBOARDED"
          ? undefined
          : proponent.invitations
              ?.filter(
                (invitation) => invitation.status === InvitationStatus.PENDING,
              )
              .sort(
                (a, b) =>
                  new Date(b.expiry_date).getTime() -
                  new Date(a.expiry_date).getTime(),
              )[0];

      // Eligibility entries logic
      const rawEntries = (proponent as any).eligibility_entries || [];
      const entries: EligibilityEntry[] = rawEntries.map((entry: any) => ({
        ...entry,
        id: entry.work_id
          ? `${entry.project_id}:work:${entry.work_id}`
          : `${entry.project_id}:non_work:${entry.non_work_item_type}`,
      }));

      const eligibleEntries = entries.filter((e) => !e.is_onboarded);
      const onboardedEntries = entries.filter((e) => e.is_onboarded && e.is_enabled);

      set({
        pendingInvitation,
        onboardedEntries,
        eligibleEntries,
      });
    } else {
      set({
        onboardedEntries: [],
        eligibleEntries: [],
      });
    }
  },

  setSelectedEntryIds: (selectedEntryIds) => set({ selectedEntryIds }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsError: (isError) => set({ isError }),
  reset: () => set(initialState),
}));
