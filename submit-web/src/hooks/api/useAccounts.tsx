import { OnErrorType, submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

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

type GetUserResponse = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  auth_guid: string;
  created_at: string;
  updated_at: string;
  account_id: number;
  account: {
    id: number;
    proponent_id: number;
  };
};
const getUserByGuid = (guid?: string) => {
  return submitRequest<GetUserResponse>({ url: `/users/guid/${guid}` });
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

export const useGetUserByGuid = ({ guid }: { guid?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    retry: false,
    ...defaultUseQueryOptions,
  });
};
