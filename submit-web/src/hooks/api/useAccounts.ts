import { OnErrorType, submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { User } from "@/models/User";

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

const getUserByGuid = (guid?: string) => {
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
};
export const getUserByGuidQueryOptions = ({ guid }: GetUserByGuidOptions) =>
  queryOptions({
    queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    ...defaultUseQueryOptions,
  });
export const useGetUserByGuid = ({ guid }: GetUserByGuidOptions) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_USER, guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    ...defaultUseQueryOptions,
  });
};
