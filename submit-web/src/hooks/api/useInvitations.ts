import { Options } from "./types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { Invitation } from "@/models/Invitation";
import { submitRequest } from "@/utils/axiosUtils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export const useCreateInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: createInvitation,
    ...options,
    onSuccess: () => {
      notify.success("Invitation sent successfully");
    },
    onError: () => {
      notify.error("Failed to send invitation");
    },
  });
};

const createInvitation = ({
  account_id,
  proponent_id,
  project_ids,
  package_ids,
  email,
  role_name,
}: {
  account_id?: number;
  proponent_id: number;
  role_name: string;
  email: string;
  project_ids: number[];
  package_ids?: string[];
}) => {
  return submitRequest({
    url: `/invitations`,
    method: "post",
    data: {
      account_id,
      proponent_id,
      role_name,
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

type CreateInvitation = {
  proponent_id: number;
  account_id?: number;
  project_ids: number[];
  role_id: number;
  package_ids?: number[];
  email?: string;
};
const createInvitation = (data: CreateInvitation) => {
  return submitRequest<Invitation>({
    url: "/invitations",
    method: "post",
    data,
  });
};

type UseCreateInvitationParams = UseMutationOptions<
  Invitation,
  Error,
  CreateInvitation,
  unknown
>;
export const useCreateInvitation = (params: UseCreateInvitationParams) => {
  return useMutation({
    mutationFn: (data: CreateInvitation) => createInvitation(data),
    ...params,
  });
};
