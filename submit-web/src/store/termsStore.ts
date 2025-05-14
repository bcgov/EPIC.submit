import { create } from "zustand";

type TermsState = {
  termsAccepted: boolean;
  showTermsModalFlag: boolean;
  versionId: number | null;
  setVersionId: (id: number | null) => void;
  setTermsAccepted: (accepted: boolean) => void;
  setShowTermsModalFlag: (show: boolean) => void;
};

export const useTermsStore = create<TermsState>((set) => ({
  termsAccepted: false,
  showTermsModalFlag: false,
  versionId: null,
  setVersionId: (id) => set({ versionId: id }),
  setTermsAccepted: (accepted) => set({ termsAccepted: accepted }),
  setShowTermsModalFlag: (show) => set({ showTermsModalFlag: show }),
}));
