import { Project } from "@/models/Project";
import { request } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Options } from "./types";

const loadProjectsByProponentId = (proponentId?: number) => {
  if (!proponentId) {
    return Promise.reject(new Error("Proponent ID is required"));
  }
  return request<Project[]>({ url: `/projects/proponents/${proponentId}` });
};

const addProjects = ({
  accountId,
  projectIds,
}: {
  accountId: number;
  projectIds: number[];
}) => {
  return request({
    url: `/projects/accounts/${accountId}`,
    method: "post",
    data: {
      project_ids: projectIds,
    },
  });
};

export const useLoadProjectsByProponentId = (proponentId?: number) => {
  return useQuery({
    queryKey: ["projects", proponentId],
    queryFn: () => loadProjectsByProponentId(proponentId),
    enabled: Boolean(proponentId),
    retry: false,
  });
};

type GetProjectsByAccountParams = {
  accountId?: number;
};
const getProjectsByAccount = ({ accountId }: GetProjectsByAccountParams) => {
  return request({ url: `/projects/accounts/${accountId}` });
};

export const useAddProjects = (options?: Options) => {
  return useMutation({
    mutationFn: addProjects,
    ...options,
  });
};

type UseGetProjectsByAccountParams = {
  accountId?: number;
};
export const useGetProjects = ({
  accountId,
}: UseGetProjectsByAccountParams) => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsByAccount({ accountId }),
    enabled: Boolean(accountId),
  });
};
