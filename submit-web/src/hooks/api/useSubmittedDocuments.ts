import { PaginatedDocumentsResponse, Submission, SubmittedDocument } from "@/models/Submission";
import { submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

type GetProjectsByParamsForStaff = {
  searchOptions?: Record<string, string | number | string[]>;
  projectId?: number;
  page?: number;
  size?: number;
};
const getDocumentsForStaff = ({
  searchOptions,
  projectId,
  page,
  size,
}: GetProjectsByParamsForStaff) => {
  const url = "/documents";

  return submitRequest<SubmittedDocument[] | PaginatedDocumentsResponse>({
    url,
    params: {
      ...searchOptions,
      project_id: projectId,
      page,
      size,
    },
  });
};


type UseGetDocumentsForStaffParams = {
  searchOptions?: Record<string, string | number | string[]>;
  projectId?: number;
  page?: number;
  size?: number;
};

export const getSubmittedDocumentsForStaffQueryOptions = ({
  searchOptions,
  projectId,
  page,
  size,
}: UseGetDocumentsForStaffParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.ACCOUNT_PROJECTS, searchOptions, projectId, page, size],
    queryFn: () => getDocumentsForStaff({ searchOptions, projectId, page, size }),
    ...defaultUseQueryOptions,
  });

export const useGetSubmittedDocumentsForStaff = ({
  searchOptions,
  projectId,
  page,
  size,
}: UseGetDocumentsForStaffParams) => {
  const options = getSubmittedDocumentsForStaffQueryOptions({
    searchOptions,
    projectId,
    page,
    size,
  });
  return useQuery(options);
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
