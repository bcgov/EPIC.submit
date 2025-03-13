import { create } from "zustand";
import { AccountUserWithRole } from '@/models/AccountUser';

type UserState = {
  selectedUser: AccountUserWithRole | null;
  setSelectedUser: (user: AccountUserWithRole | null) => void;
  resetUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  selectedUser: null,
  setSelectedUser: (user) => set({ selectedUser: user }),
  resetUser: () => set({ selectedUser: null }),
}));
