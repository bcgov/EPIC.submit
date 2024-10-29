import { AccountProject, Project } from "@/models/Project";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Options } from "./types";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const loadProjectsByProponentId = (proponentId?: number) => {
  if (!proponentId) {
    return Promise.reject(new Error("Proponent ID is required"));
  }
  return submitRequest<Project[]>({
    url: `/projects/proponents/${proponentId}`,
  });
};

const addProjects = ({
  accountId,
  projectIds,
}: {
  accountId: number;
  projectIds: number[];
}) => {
  return submitRequest({
    url: `/projects/accounts/${accountId}`,
    method: "post",
    data: {
      project_ids: projectIds,
    },
  });
};

export const useLoadProjectsByProponentId = (proponentId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.PROJECTS, proponentId],
    queryFn: () => loadProjectsByProponentId(proponentId),
    enabled: Boolean(proponentId),
    retry: false,
  });
};

type GetProjectsByAccountParams = {
  accountId?: number;
  searchOptions?: Record<string, string | number | string[]>;
};

const getAccountProjectsByAccountId = ({
  accountId,
  searchOptions,
}: GetProjectsByAccountParams) => {
  // Initialize URL with base path and account ID
  const url = `/projects/accounts/${accountId}`;

  return submitRequest<AccountProject[]>({
    url,
    params: searchOptions,
  });
};

export const useAddProjects = (options?: Options) => {
  return useMutation({
    mutationFn: addProjects,
    ...options,
  });
};

type UseGetProjectsByAccountParams = {
  accountId: number;
  searchOptions?: Record<string, string | number | string[]>;
  // queryOptions?: Record<string, unknown>;
};
export const useGetAccountProjects = ({
  accountId,
  searchOptions,
}: UseGetProjectsByAccountParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_PROJECTS, accountId, searchOptions],
    queryFn: () => getAccountProjectsByAccountId({ accountId, searchOptions }),
    enabled: Boolean(accountId),
    ...defaultUseQueryOptions,
  });
};

type GetAccountProjectsByIdParams = {
  accountProjectId: number;
};
const getAccountProjectById = ({
  accountProjectId,
}: GetAccountProjectsByIdParams) => {
  return submitRequest<AccountProject>({
    url: `projects/${accountProjectId}`,
  });
};

type UseGetAccountProjectByIdParams = {
  accountProjectId: number;
};

export const useGetAccountProject = ({
  accountProjectId,
}: UseGetAccountProjectByIdParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCOUNT_PROJECT, accountProjectId],
    queryFn: () => getAccountProjectById({ accountProjectId }),
    enabled: Boolean(accountProjectId),
    ...defaultUseQueryOptions,
  });
};
