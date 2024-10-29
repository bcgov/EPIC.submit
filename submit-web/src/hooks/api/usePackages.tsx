import { submitRequest } from "@/utils/axiosUtils";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Options } from "./types";
import { SubmissionPackage } from "@/models/Package";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const createSubmissionPackage = ({
  accountProjectId,
  data,
}: {
  accountProjectId: number;
  data: Record<string, unknown>;
}) => {
  return submitRequest<SubmissionPackage>({
    url: `/packages/account-projects/${accountProjectId}`,
    method: "post",
    data,
  });
};

export const useCreateSubmissionPackage = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubmissionPackage,
    ...options,
    onSuccess: (submissionPackage) => {
      if (options?.onSuccess) {
        options.onSuccess(submissionPackage);
      }
      queryClient.setQueryData(
        [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackage.id],
        submissionPackage,
      );
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEY.ACCOUNT_PROJECT,
          submissionPackage.account_project_id,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
      });
    },
  });
};

type GetSubmissionPackageByIdParams = {
  packageId: number;
};
const getSubmissionPackageById = ({
  packageId,
}: GetSubmissionPackageByIdParams) => {
  return submitRequest<SubmissionPackage>({
    url: `packages/${packageId}`,
  });
};

type UseGetSubmissionPackageByIdParams = {
  packageId: number;
  enabled?: boolean;
};

export const getSubmissionPackageQueryOptions = ({
  packageId,
  enabled = true,
}: UseGetSubmissionPackageByIdParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
    queryFn: () => getSubmissionPackageById({ packageId }),
    enabled: enabled && Boolean(packageId),
    ...defaultUseQueryOptions,
  });

export const useGetSubmissionPackage = ({
  packageId,
  enabled = true,
}: UseGetSubmissionPackageByIdParams) => {
  const options = getSubmissionPackageQueryOptions({ packageId, enabled });
  return useQuery(options);
};

const updateStateSubmissionPackage = ({
  packageId,
  data,
}: {
  packageId: number;
  data: Record<string, unknown>;
}) => {
  return submitRequest<SubmissionPackage>({
    url: `/packages/${packageId}/state`,
    method: "post",
    data,
  });
};

export const useUpdateStateSubmissionPackage = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStateSubmissionPackage,
    ...options,
    onSuccess: (submissionPackage) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      queryClient.setQueryData(
        [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackage.id],
        submissionPackage,
      );
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEY.ACCOUNT_PROJECT,
          submissionPackage.account_project_id,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
      });
    },
  });
};
