import { submitRequest } from "@/utils/axiosUtils";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { Invitation } from "@/models/Invitation";

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
const acceptInvitation = (token: string, data: CreateAccountRequest) => {
  return submitRequest<AcceptInvitationResponse>({
    url: `/invitations/${token}/accept`,
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
  if (!token) {
    throw new Error("token is required");
  }
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => acceptInvitation(token, data),
    ...rest,
  });
};
