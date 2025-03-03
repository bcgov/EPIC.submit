import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { Invitation } from "@/models/Invitation";

const getInvitation = () => {
  return submitRequest<Invitation>({ url: "/invitations" });
};

export const useGetInvitation = (token: string, enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEY.INVITATION, token],
    queryFn: getInvitation,
    staleTime: 0,
    enabled: enabled,
  });
};
