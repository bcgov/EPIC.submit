import { Proponent } from "@/models/Proponent";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useQuery } from "@tanstack/react-query";

const getProponents = () => {
  return submitRequest<Proponent[]>({
    url: `proponents`,
    params: {
      "approved-conditions": "true",
    },
  });
};

export const useGetProponents = () => {
  return useQuery({
    queryKey: [QUERY_KEY.PROPONENTS],
    queryFn: getProponents,
  });
};

const getAllProponents = () => {
  return submitRequest<Proponent[]>({
    url: `proponents`,
  });
};

export const useGetAllProponents = () => {
  return useQuery({
    queryKey: [QUERY_KEY.PROPONENTS, "all"],
    queryFn: getAllProponents,
  });
};

type GetProponentOptions = {
  includeProjects?: boolean;
  includeInvitations?: boolean;
};

const getProponent = (
  proponentId: number,
  options: GetProponentOptions = {},
) => {
  const params: Record<string, string> = {};
  if (options.includeProjects) {
    params["include-projects"] = String(Boolean(options.includeProjects));
  }
  if (options.includeInvitations) {
    params["include-invitations"] = String(Boolean(options.includeInvitations));
  }
  return submitRequest<Proponent>({
    url: `proponents/${proponentId}`,
    params,
  });
};

export const getProponentOptions = (
  proponentId: number | string,
  options: GetProponentOptions = {},
) => {
  return {
    queryKey: [QUERY_KEY.PROPONENT, proponentId, options],
    queryFn: () => getProponent(Number(proponentId), options),
  };
};

export const useGetProponent = (
  proponentId: number,
  options: GetProponentOptions = {},
) => {
  return useQuery({
    queryKey: [QUERY_KEY.PROPONENT, proponentId],
    queryFn: () => getProponent(Number(proponentId), options),
    enabled: !!proponentId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
