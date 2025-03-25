import { getAccount, getUserByGuid } from "@/hooks/api/useAccounts";
import { Role } from "@/models/AccountUser";
import { USER_TYPE, UserType } from "@/models/User";
import { getUserRolesFromToken } from "@/utils";
import { create } from "zustand";

export type AccountStoreState = {
  proponentId: number;
  accountId: number;
  userId: number;
  isLoading: boolean;
  userType?: UserType;
  roles?: string[];
  userManagementRole?: Role;
  setAccount: (account: Partial<AccountStoreState>) => void;
  getAccountData: () => Promise<AccountStoreState>;
};

export const useAccount = create<AccountStoreState>((set, get) => ({
  proponentId: 0,
  accountId: 0,
  userId: 0,
  isLoading: true,
  userType: undefined,
  roles: [],
  userManagementRole: undefined,
  setAccount: (account: Partial<AccountStoreState>) =>
    set((prev) => ({ ...prev, ...account })),
  getAccountData: async (guid?: string) => {
    if (!guid) {
      return Promise.resolve(get());
    }
    const user = await getUserByGuid(guid);

    if (user?.account_user) {
      const _account = {
        ...get(),
        userId: user.id,
        isLoading: false,
        proponentId: user.account_user.account.proponent_id,
        accountId: user.account_user.account.id,
        userType: USER_TYPE.PROPONENT,
        userManagementRole: user.account_user.role,
        roles: user.account_user.role.permissions,
      };
      set((prev) => ({ ...prev, ..._account }));
      return Promise.resolve(_account);
    } else if (user?.staff_user) {
      const _account = {
        ...get(),
        userId: user.id,
        isLoading: false,
        userType: USER_TYPE.STAFF,
        roles: getUserRolesFromToken(guid),
      };
      return Promise.resolve(_account);
    }

    return Promise.reject(new Error("User not found"));
  },
}));
