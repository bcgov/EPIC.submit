import { UserType } from "@/models/User";
import { create } from "zustand";

interface AccountStoreState {
  proponentId: number;
  accountId: number;
  userId: number;
  isLoading: boolean;
  userType?: UserType;
  roles?: string[];
  setAccount: (account: Partial<AccountStoreState>) => void;
}

export const useAccount = create<AccountStoreState>((set) => ({
  proponentId: 0,
  accountId: 0,
  userId: 0,
  isLoading: true,
  userType: undefined,
  roles: [],
  setAccount: (account: Partial<AccountStoreState>) =>
    set((prev) => ({ ...prev, ...account })),
}));
