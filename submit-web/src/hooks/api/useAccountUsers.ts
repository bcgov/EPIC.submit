import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { submitRequest } from "@/utils/axiosUtils";
import {
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Options } from "./types";
import { AccountUserWithRole } from "@/models/AccountUser";
import { isAxiosError } from "axios";

const getAccountUsers = (accountId: number, allUsers?: boolean) => {
  return submitRequest<AccountUserWithRole[]>({
    url: `/accounts/${accountId}/users${allUsers ? "?all_users=true" : ""}`,
  });
};

type GetAccountUsersOptions = {
  accountId?: number;
  // When true, fetch every user in the account regardless of project scope
  // (used e.g. for selecting submission contacts).
  allUsers?: boolean;
};

export const useGetAccountUsers = ({
  accountId,
  allUsers,
}: GetAccountUsersOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USERS, accountId, allUsers],
    queryFn: () => getAccountUsers(accountId!, allUsers),
    enabled: Boolean(accountId),
    ...defaultUseQueryOptions,
  });
};

const getAccountUserById = (accountUserId: number) => {
  return submitRequest<AccountUserWithRole>({
    url: `/accounts/users/${accountUserId}`,
  });
};

type GetAccountUserByIdOptions = {
  accountUserId?: number;
};

export const useGetAccountUserById = ({ accountUserId }: GetAccountUserByIdOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, accountUserId],
    queryFn: () => getAccountUserById(accountUserId!),
    enabled: Boolean(accountUserId),
    ...defaultUseQueryOptions,
  });
};

const getUserProfileByGuid = (guid?: string) => {
  return submitRequest<AccountUserWithRole>({ url: `/accounts/user/${guid}` });
};

type GetUserProfileByGuidOptions = {
  guid?: string;
};

export const useAccountGetUserByGuid = ({
  guid,
}: GetUserProfileByGuidOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USERS, guid],
    queryFn: () => getUserProfileByGuid(guid),
    enabled: Boolean(guid),
    ...defaultUseQueryOptions,
  });
};

type EditUserProfileRequest = {
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
};

export const editUserProfile = (guid: string, data: EditUserProfileRequest) => {
  return submitRequest<AccountUserWithRole>({
    url: `/accounts/user/${guid}`,
    method: "patch",
    data,
  });
};

type UseSaveUserProfileParams = {
  guid: string;
  options?: Options;
};
export const useSaveUserProfile = ({
  guid,
  options,
}: UseSaveUserProfileParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EditUserProfileRequest) => {
      if (!guid) {
        throw new Error("GUID is required");
      }

      return editUserProfile(guid, data);
    },
    ...options,
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      }

      // Invalidate the query for user profile to refetch data after update
      if (guid) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.ACCOUNT_USERS, guid],
        });
      }
    },
  });
};

type EditUserRequest = {
  role_name: string;
  account_project_ids: number[];
  package_ids?: number[];
  original_package_ids?: number[];
};
export const editUserRole = (
  account_user_id: number,
  data: EditUserRequest,
) => {
  return submitRequest<AccountUserWithRole>({
    url: `/accounts/user/${account_user_id}/role`,
    method: "patch",
    data,
  });
};

type UseSaveUserRoleParams = {
  account_user_id: number;
  options?: Options;
};
export const useSaveUserRole = ({
  account_user_id,
  options,
}: UseSaveUserRoleParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EditUserRequest) => {
      if (!account_user_id) {
        throw new Error("Account user id is required");
      }

      return editUserRole(account_user_id, data);
    },
    ...options,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_USER, account_user_id, "access-history"],
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      const defaultMessage = "An error occurred while updating the user role.";
      const errorMessage = isAxiosError(error)
        ? (error.response?.data.message ?? defaultMessage)
        : defaultMessage;

      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }
    },
  });
};

type EditUserStatusRequest = {
  active: boolean;
};
export const editUserStatus = (
  account_user_id: number,
  data: EditUserStatusRequest,
) => {
  return submitRequest<AccountUserWithRole>({
    url: `/accounts/user/${account_user_id}/status`,
    method: "patch",
    data,
  });
};

export const useSaveUserStatus = ({
  account_user_id,
  options,
}: UseSaveUserRoleParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EditUserStatusRequest) => {
      if (!account_user_id) {
        throw new Error("Account user id is required");
      }

      return editUserStatus(account_user_id, data);
    },
    ...options,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_USERS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_USER, account_user_id, "access-history"],
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      const defaultMessage =
        "An error occurred while updating the user status.";
      const errorMessage = isAxiosError(error)
        ? (error.response?.data.message ?? defaultMessage)
        : defaultMessage;

      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }
    },
  });
};

type TermsUpdateRequest = {
  account_user_id: number;
  terms_of_service_version_id: number | null;
  has_agreed_to_terms: boolean;
};
const recordUserTermsOfService = ({
  account_user_id,
  ...rest
}: TermsUpdateRequest): Promise<any> => {
  return submitRequest({
    url: `/accounts/user/${account_user_id}/terms-of-service`,
    method: "patch",
    data: rest,
  });
};

export const useRecordUserTermsOfService = (
  options?: UseMutationOptions<any, AxiosError, TermsUpdateRequest>,
) => {
  return useMutation<any, AxiosError, TermsUpdateRequest>({
    mutationFn: recordUserTermsOfService,
    ...options,
  });
};


export type AccessHistoryEntry = {
  id: number;
  account_project_id: number;
  project_name: string;
  role_name: string;
  role_label: string;
  active: boolean;
  access_start: string | null;
  access_end: string | null;
  original_package_ids: number[] | null;
  package_names: string[];
};

const getAccessHistory = (accountUserId: number) => {
  return submitRequest<AccessHistoryEntry[]>({
    url: `/accounts/user/${accountUserId}/access-history`,
  });
};

type UseGetAccessHistoryOptions = {
  accountUserId?: number | null;
};

export const useGetAccessHistory = ({
  accountUserId,
}: UseGetAccessHistoryOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, accountUserId, "access-history"],
    queryFn: () => getAccessHistory(accountUserId!),
    enabled: Boolean(accountUserId),
    ...defaultUseQueryOptions,
  });
};
