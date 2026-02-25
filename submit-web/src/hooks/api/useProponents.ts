import { Proponent } from "@/models/Proponent";
import { OnErrorType, submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useQuery, useMutation } from "@tanstack/react-query";

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
  includeAdministrators?: boolean;
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
  if (options.includeAdministrators) {
    params["include-administrators"] = String(
      Boolean(options.includeAdministrators),
    );
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

const enableProponentProjects = ({
  proponentId,
  projectIds,
}: {
  proponentId: number;
  projectIds: (string | number)[];
}) => {
  return submitRequest<Proponent>({
    url: `proponents/${proponentId}/projects`,
    method: "post",
    data: {
      projects: projectIds
    },
  });
};

type EnableProponentProjectOptions = {
  onSuccess?: (data: Proponent) => void;
  onError?: OnErrorType;
};
export const useEnableProponentProject = (options: EnableProponentProjectOptions) => {
  return useMutation({
    mutationFn: enableProponentProjects,
    ...options,
  });
};
