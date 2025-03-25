import { OnErrorType, submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { User, USER_TYPE } from "@/models/User";
import { AccountUserWithRole } from "@/models/AccountUser";
import { AccountStoreState, useAccount } from "@/store/accountStore";
import { useAuth } from "react-oidc-context";
import { getUserRolesFromToken } from "@/utils";
import { useEffect } from "react";

type CreateAccountRequest = {
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  proponent_id: number;
  auth_guid: string;
};
export type CreateAccountResponse = {
  id: number;
  proponent_id: number;
};
const createAccount = (account: CreateAccountRequest) => {
  return submitRequest<CreateAccountResponse>({
    url: "/accounts",
    method: "post",
    data: account,
  });
};

export const getUserByGuid = (guid?: string) => {
  if (!guid) {
    return Promise.resolve(null);
  }
  return submitRequest<User>({ url: `/users/guid/${guid}` });
};

type CreateAccountOptions = {
  onSuccess?: (data: CreateAccountResponse) => void;
  onError?: OnErrorType;
};
export const useCreateAccount = (options: CreateAccountOptions) => {
  return useMutation({
    mutationFn: createAccount,
    ...options,
  });
};

type GetUserByGuidOptions = {
  guid?: string;
  enabled?: boolean;
};
export const getUserByGuidQueryOptions = ({
  guid,
  enabled,
}: GetUserByGuidOptions) => {
  return queryOptions({
    queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
    queryFn: () => getUserByGuid(guid),
    enabled: enabled ?? Boolean(enabled),
    ...defaultUseQueryOptions,
  });
};
export const useGetUserByGuid = ({ guid }: GetUserByGuidOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    ...defaultUseQueryOptions,
  });
};

const getUserByAccount = (
  accountId: number,
  includeRoles: boolean = false,
  includeInvitees: boolean = false,
) => {
  return submitRequest<AccountUserWithRole[]>({
    url: `/accounts/${accountId}/users?include_invitees=${includeInvitees}&include_roles=${includeRoles}`,
  });
};

type GetUserByAccountOptions = {
  accountId: number;
  includeRoles: boolean;
  includeInvitees: boolean;
};

export const useGetUserByAccountId = ({
  accountId,
  includeRoles,
  includeInvitees,
}: GetUserByAccountOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USERS, accountId],
    queryFn: () => getUserByAccount(accountId, includeRoles, includeInvitees),
    enabled: Boolean(accountId),
  });
};

export const getAccount = async (
  guid?: string,
): Promise<Partial<AccountStoreState>> => {
  console.log("guid", guid);
  if (!guid) {
    return Promise.resolve({});
  }
  const user = await getUserByGuid(guid);

  console.log("user", user);

  if (user?.account_user) {
    console.log("A");
    return Promise.resolve({
      userId: user.id,
      isLoading: false,
      proponentId: user.account_user.account.proponent_id,
      accountId: user.account_user.account.id,
      userType: USER_TYPE.PROPONENT,
      userManagementRole: user.account_user.role,
      roles: user.account_user.role.permissions,
    });
  }
  if (user?.staff_user) {
    console.log("B");
    return Promise.resolve({
      userId: user.id,
      isLoading: false,
      userType: USER_TYPE.STAFF,
      roles: getUserRolesFromToken(guid),
    });
  }

  return Promise.resolve({
    isLoading: false,
  });
};

type GetAccountQueryOptions = {
  guid?: string;
  enabled?: boolean;
};
export const getAccountQueryOptions = ({
  guid,
  enabled,
}: GetAccountQueryOptions) => {
  return {
    queryKey: [QUERY_KEY.USER_ACCOUNT_DATA, guid],
    queryFn: () => getAccount(guid),
    enabled: enabled,
    ...defaultUseQueryOptions,
    staleTime: 0,
  };
};

export const useAccountQuery = (guid?: string) => {
  return useQuery(getAccountQueryOptions({ guid }));
};
