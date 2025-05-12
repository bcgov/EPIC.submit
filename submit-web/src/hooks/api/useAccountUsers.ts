import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { OnErrorType, OnSuccessType, submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import { AccountUserWithRole } from "@/models/AccountUser";
import { isAxiosError } from "axios";

const getUserProfileByGuid = (guid?: string) => {
  return submitRequest<AccountUserWithRole>({ url: `/accounts/user/${guid}` });
};

type GetUserProfileByGuidOptions = {
  guid?: string;
};

export const useAccountGetUserByGuid = ({ guid }: GetUserProfileByGuidOptions) => {
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
      }
    },
  });
};

type EditUserRequest = {
  role_name: string;
  package_ids?: number[];
};
export const editUserRole = (account_user_id: number, data: EditUserRequest) => {
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
  return useMutation({
    mutationFn: (data: EditUserRequest) => {
      if (!account_user_id) {
        throw new Error("Account user id is required");
      }

      return editUserRole(account_user_id, data);
    },
    ...options,
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
    onError: (error: any) => {
      const defaultMessage = "An error occurred while updating the user role.";
      const errorMessage = isAxiosError(error)
        ? error.response?.data.message ?? defaultMessage
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
export const editUserStatus = (account_user_id: number, data: EditUserStatusRequest) => {
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
  return useMutation({
    mutationFn: (data: EditUserStatusRequest) => {
      if (!account_user_id) {
        throw new Error("Account user id is required");
      }

      return editUserStatus(account_user_id, data);
    },
    ...options,
    onSuccess: (data) => {
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      const defaultMessage = "An error occurred while updating the user status.";
      const errorMessage = isAxiosError(error)
        ? error.response?.data.message ?? defaultMessage
        : defaultMessage;

      if (options?.onError) {
        options.onError(new Error(errorMessage));
      }
    },
  });
};

type TermsUpdateRequest = {
  account_user_id: number;
  agreed_terms_of_service_id: number | null;
  agreed_terms: boolean;
};
const recordUserTermsOfService = ({
  account_user_id,
  ...rest
}: TermsUpdateRequest) => {
  return submitRequest({
    url: `/accounts/user/${account_user_id}/terms-of-service`,
    method: "patch",
    data: rest,
  });
};

export const useRecordUserTermsOfService = (
  onSuccess: OnSuccessType,
  onError: OnErrorType,
) => {
  return useMutation({
    mutationFn: recordUserTermsOfService,
    onSuccess,
    onError,
  });
};
