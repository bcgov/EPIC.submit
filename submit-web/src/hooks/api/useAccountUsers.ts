import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import { AccountUserWithRole } from "@/models/AccountUser";

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
          queryKey: [QUERY_KEY.ACCOUNT_USERS, guid],
        });
      }
    },
  });
};
