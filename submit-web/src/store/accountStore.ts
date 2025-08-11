import { Role } from "@/models/AccountUser";
import { UserType } from "@/models/User";
import { AxiosError } from "axios";
import { create } from "zustand";

export type AccountStoreActions = {
  setAccount: (account: Partial<AccountStoreState>) => void;
  reset: () => void;
};

export type AccountStoreState = {
  proponentId: number;
  accountId: number;
  userId: number;
  isLoading: boolean;
  userType?: UserType;
  hasAgreedToTerms: boolean;
  roles?: string[];
  userManagementRole?: Role;
  userManagementRoles?: Role[];
  error?: AxiosError;
};

export type AccountStore = AccountStoreState & AccountStoreActions;

export const initialAccountState = {
  proponentId: 0,
  accountId: 0,
  userId: 0,
  isLoading: true,
  userType: undefined,
  hasAgreedToTerms: false,
  roles: [],
  userManagementRole: undefined,
  error: undefined,
};
export const useAccount = create<AccountStore>((set) => ({
  ...initialAccountState,
  setAccount: (account: Partial<AccountStoreState>) =>
    set((prev) => ({ ...prev, ...account })),
  reset: () => set({ ...initialAccountState, isLoading: false }),
}));
