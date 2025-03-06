import { Invitation } from "@/models/Invitation";
import { create } from "zustand";

interface CreateAccountFormState {
  step: number;
  setStep: (step: number) => void;
  invitation?: Invitation;
  setInvitation: (invitation: Invitation) => void;
}

export const useCreateAccountForm = create<CreateAccountFormState>((set) => ({
  step: 0,
  setStep: (step: number) => set(() => ({ step })),
  invitation: undefined,
  setInvitation: (invitation: Invitation) => set(() => ({ invitation })),
}));
