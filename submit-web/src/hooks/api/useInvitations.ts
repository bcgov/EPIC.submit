import { Options } from "./types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { Invitation } from "@/models/Invitation";
import { submitRequest, publicRequest } from "@/utils/axiosUtils";
import { Role } from "@/models/AccountUser";
import { useAccount } from "@/store/accountStore";

export const useCreateInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: createInvitation,
    ...options,
  });
};
type CreateInvitation = {
  account_id?: number;
  proponent_id: number;
  role_name: string;
  email?: string;
  project_ids: number[];
  package_ids?: number[];
};
const createInvitation = ({
  account_id,
  proponent_id,
  project_ids,
  package_ids,
  email,
  role_name,
}: CreateInvitation) => {
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
  return publicRequest<Invitation>({ url: `/invitations/${token}` });
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
  extension_number?: string;
  agreed_terms_of_service_id: number | null;
  agreed_terms: boolean;
};

export type AcceptInvitationResponse = {
  message: string;
  user_id: number;
  role: Role;
};

const acceptInvitation = (
  token: string | undefined,
  data: CreateAccountRequest
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

export const useResendInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: (invitationId: number) => resendInvitation(invitationId),
    ...options,
  });
};

const resendInvitation = (invitationId: number) => {
  return submitRequest({
    url: `/invitations/id/${invitationId}/resend`,
    method: "post",
  });
};

export const useRevokeInvitation = (options?: Options) => {
  const queryClient = useQueryClient();
  const { accountId } = useAccount();

  return useMutation({
    mutationFn: (invitationId: number) => revokeInvitation(invitationId),
    ...options,
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_USERS, accountId],
      });
    },
  });
};

const revokeInvitation = (invitationId: number) => {
  return submitRequest({
    url: `/invitations/id/${invitationId}`,
    method: "delete",
  });
};
