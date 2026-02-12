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

export const useCreateInvitationToExistingProject = (options?: Options) => {
  return useMutation({
    mutationFn: createInvitationToExistingProject,
    ...options,
  });
};

type CreateInvitationToExistingProject = {
  account_id: number;
  proponent_id: number;
  role_name: string;
  email: string;
  account_project_ids?: number[];
  project_ids?: number[];
  original_package_ids?: number[];
};

const createInvitationToExistingProject = ({
  account_id,
  proponent_id,
  account_project_ids,
  project_ids,
  original_package_ids,
  email,
  role_name,
}: CreateInvitationToExistingProject) => {
  return submitRequest({
    url: `/invitations`,
    method: "post",
    data: {
      account_id,
      proponent_id,
      role_name,
      email,
      account_project_ids,
      project_ids,
      original_package_ids,
    },
  });
};

export const useCreateNewAccountProjectInvitation = (options?: Options) => {
  return useMutation({
    mutationFn: createNewAccountProjectInvitation,
    ...options,
  });
};

type CreateNewAccountProjectInvitation = {
  proponent_id: number;
  role_name: string;
  project_ids: (string | number)[];
};

const createNewAccountProjectInvitation = ({
  proponent_id,
  project_ids,
  role_name,
}: CreateNewAccountProjectInvitation) => {
  return submitRequest({
    url: `/invitations/account`,
    method: "post",
    data: {
      proponent_id,
      role_name,
      project_ids,
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

export const useGetInvitationByToken = (token: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.INVITATION, token],
    queryFn: () => getInvitation(token),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!token,
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
  company_name?: string;
  terms_of_service_version_id: number | null;
  has_agreed_to_terms: boolean;
};

export type AcceptInvitationResponse = {
  message: string;
  user_id: number;
  roles: Role[];
  account_id: number;
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
