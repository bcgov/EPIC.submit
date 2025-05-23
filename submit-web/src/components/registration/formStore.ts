import { persist, PersistOptions } from "zustand/middleware";
import { Invitation } from "@/models/Invitation";
import { create } from "zustand";

interface CreateAccountFormState {
  step: number;
  setStep: (step: number) => void;
  invitation?: Invitation;
  setInvitation: (invitation: Invitation) => void;
}

type CreateAccountFormPersist = PersistOptions<CreateAccountFormState>;

export const useCreateAccountForm = create<CreateAccountFormState>()(
  persist(
    (set) => ({
      step: 0,
      setStep: (step) => set({ step }),
      invitation: undefined,
      setInvitation: (invitation) => set({ invitation }),
    }),
    {
      name: 'create-account-form',
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => {
          sessionStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          sessionStorage.removeItem(key);
        },
      },
      partialize: (state) => ({
        invitation: state.invitation,
      }),
    } as CreateAccountFormPersist
  )
);