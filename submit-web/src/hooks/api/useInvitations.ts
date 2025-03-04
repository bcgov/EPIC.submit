import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
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
