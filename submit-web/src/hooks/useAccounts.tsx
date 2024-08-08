import { OnErrorType, OnSuccessType, request } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";

const defaultOnSuccess: OnSuccessType = () => {
  return;
};
const defaultOnError: OnErrorType = () => {
  return;
};
type CreateAccount = {
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  proponent_id: string;
  auth_guid: string;
};
const createAccount = (account: CreateAccount) => {
  return request({ url: "/accounts", method: "post", data: account });
};

type GetUserResponse = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  proponent_id: string;
  auth_guid: string;
  created_at: string;
  updated_at: string;
  account?: any;
};
const getUserByGuid = (guid?: string) => {
  return request<GetUserResponse>({ url: `/users/guid/${guid}` });
};

export const useCreateAccount = (
  onSuccess = defaultOnSuccess,
  onError = defaultOnError,
) => {
  return useMutation({
    mutationFn: createAccount,
    onSuccess,
    onError,
  });
};

export const useGetUserByGuid = ({ guid }: { guid?: string }) => {
  return useQuery({
    queryKey: ["user", guid],
    queryFn: () => getUserByGuid(guid),
    enabled: Boolean(guid),
    retry: false,
  });
};
