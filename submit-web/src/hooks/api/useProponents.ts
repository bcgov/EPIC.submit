import { Proponent } from "@/models/Proponent";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useQuery } from "@tanstack/react-query";

const getProponents = () => {
  return submitRequest<Proponent[]>({
    url: `staff/proponents`,
  });
};

export const useGetProponents = () => {
  return useQuery({
    queryKey: [QUERY_KEY.PROPONENTS],
    queryFn: getProponents,
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
    url: `staff/proponents/${proponentId}`,
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
  return useQuery(getProponentOptions(proponentId, options));
};
