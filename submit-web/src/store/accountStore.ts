import { UserType } from "@/models/User";
import { create } from "zustand";

interface AccountStoreState {
  proponentId: number;
  accountId: number;
  isLoading: boolean;
  userType?: UserType;
  setAccount: (account: Partial<AccountStoreState>) => void;
}

export const useAccount = create<AccountStoreState>((set) => ({
  proponentId: 0,
  accountId: 0,
  isLoading: true,
  userType: undefined,
  setAccount: (account: Partial<AccountStoreState>) =>
    set((prev) => ({ ...prev, ...account })),
}));
