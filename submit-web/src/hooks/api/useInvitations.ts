import { Options } from "./types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { Invitation } from "@/models/Invitation";
import { submitRequest } from "@/utils/axiosUtils";

export const useCreateInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: createInvitation,
    ...options,
  });
};

const createInvitation = ({
  account_id,
  proponent_id,
  project_ids,
  package_ids,
  email,
  role_id,
}: {
  account_id: number;
  proponent_id: number;
  role_id: number;
  email: string;
  project_ids: number[];
  package_ids: string[];
}) => {
  return submitRequest({
    url: `/invitations`,
    method: "post",
    data: {
      account_id,
      proponent_id,
      role_id,
      email,
      project_ids,
      package_ids,
    },
  });
};

const getInvitation = (token: string) => {
  return submitRequest<Invitation>({ url: `/invitations/${token}` });
};

export const useGetInvitation = (token: string, enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEY.INVITATION, token],
    queryFn: () => getInvitation(token),
    staleTime: 0,
    enabled: enabled,
  });
};

type CreateAccountRequest = {
  first_name: string;
  last_name: string;
  position: string;
  work_contact_number: string;
  work_email_address: string;
  proponent_id: number;
  auth_guid: string;
};

export type AcceptInvitationResponse = {
  message: string;
  user_id: number;
  role: string;
};
const acceptInvitation = (
  token: string | undefined,
  data: CreateAccountRequest,
) => {
  if (!token) {
    return Promise.reject(new Error("Token is required"));
  }
  return submitRequest<AcceptInvitationResponse>({
    url: `/invitations/${token}`,
    method: "post",
    data,
  });
};

type UseAcceptInvitationParams = {
  token?: string;
} & UseMutationOptions<
  AcceptInvitationResponse,
  Error,
  CreateAccountRequest,
  unknown
>;
export const useAcceptInvitation = ({
  token,
  ...rest
}: UseAcceptInvitationParams) => {
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => acceptInvitation(token, data),
    ...rest,
  });
};
