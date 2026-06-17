import {
  PaginatedDocumentsResponse,
  Submission,
  SubmittedDocument,
} from "@/models/Submission";
import { submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

type GetProjectsByParams = {
  searchOptions?: Record<string, string | number | string[]>;
  projectId?: number;
  page?: number;
  size?: number;
};
const getDocuments = ({
  searchOptions,
  projectId,
  page,
  size,
}: GetProjectsByParams) => {
  const url = "/documents";

  return submitRequest<SubmittedDocument[] | PaginatedDocumentsResponse>({
    url,
    params: {
      ...searchOptions,
      project_id: projectId,
      page,
      size,
    },
    paramsSerializer: (params: Record<string, any>) => {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
      return searchParams.toString();
    },
  });
};

type UseGetDocumentsParams = {
  searchOptions?: Record<string, string | number | string[]>;
  projectId?: number;
  page?: number;
  size?: number;
  enabled?: boolean;
};

export const getSubmittedDocumentsQueryOptions = ({
  searchOptions,
  projectId,
  page,
  size,
}: UseGetDocumentsParams) =>
  queryOptions({
    queryKey: [
      QUERY_KEY.ACCOUNT_PROJECTS,
      searchOptions,
      projectId,
      page,
      size,
    ],
    queryFn: () => getDocuments({ searchOptions, projectId, page, size }),
    ...defaultUseQueryOptions,
  });

export const useGetSubmittedDocuments = ({
  searchOptions,
  projectId,
  page,
  size,
  enabled = true,
}: UseGetDocumentsParams) => {
  const options = getSubmittedDocumentsQueryOptions({
    searchOptions,
    projectId,
    page,
    size,
  });
  return useQuery({ ...options, enabled });
};

export const getSubmittedDocumentsByPackageIdForStaffQueryOptions = ({
  packageId,
}: {
  packageId: string;
}) =>
  queryOptions({
    queryKey: [QUERY_KEY.PACKAGE_DOCUMENT_SUBMISSIONS, packageId],
    queryFn: () =>
      submitRequest<Submission[]>({
        url: `/documents/submissions/packages/${packageId}`,
      }),
    staleTime: 0,
  });
