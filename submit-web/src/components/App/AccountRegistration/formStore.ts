import { persist, PersistOptions } from "zustand/middleware";
import { Invitation } from "@/models/Invitation";
import { create } from "zustand";

interface CreateAccountFormState {
  invitation?: Invitation;
  setInvitation: (invitation: Invitation) => void;
  entityName?: string;
  setEntityName: (entityName: string) => void;
  completed: string;
  setCompleted: (completed: string) => void;
  newlyCreatedAccount: boolean;
  setNewlyCreatedAccount: (newlyCreatedAccount: boolean) => void;
}

type CreateAccountFormPersist = PersistOptions<CreateAccountFormState>;

export const useCreateAccountFormStore = create<CreateAccountFormState>()(
  persist(
    (set) => ({
      invitation: undefined,
      setInvitation: (invitation) => set({ invitation }),
      entityName: undefined,
      setEntityName: (entityName) => set({ entityName }),
      completed: "",
      setCompleted: (completed) => set({ completed }),
      newlyCreatedAccount: false,
      setNewlyCreatedAccount: (newlyCreatedAccount) => set({ newlyCreatedAccount }),
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
        entityName: state.entityName,
        completed: state.completed,
      }),
    } as CreateAccountFormPersist
  )
);
