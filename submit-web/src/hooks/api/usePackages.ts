import { submitRequest } from "@/utils/axiosUtils";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Options } from "./types";
import { SubmissionPackage } from "@/models/Package";
import {
  defaultUseQueryOptions,
  QUERY_KEY,
  STAFF_QUERY_KEY,
} from "./constants";

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

const getStaffSubmissionPackageById = ({
  packageId,
}: GetSubmissionPackageByIdParams) => {
  return submitRequest<SubmissionPackage>({
    url: `staff/packages/${packageId}`,
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

export const getStaffSubmissionPackageQueryOptions = ({
  packageId,
  enabled = true,
}: UseGetSubmissionPackageByIdParams) =>
  queryOptions({
    queryKey: [STAFF_QUERY_KEY.SUBMISSION_PACKAGE, packageId],
    queryFn: () => getStaffSubmissionPackageById({ packageId }),
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

export const useGetStaffSubmissionPackage = ({
  packageId,
  enabled = true,
}: UseGetSubmissionPackageByIdParams) => {
  const options = getStaffSubmissionPackageQueryOptions({ packageId, enabled });
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackage.id],
      });
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

const createPackageUpdateRequest = ({
  packageId,
  data,
}: {
  packageId: number;
  data: Record<string, unknown>;
}) => {
  return submitRequest<SubmissionPackage>({
    url: `/staff/packages/${packageId}/update-request`,
    method: "post",
    data,
  });
};

type UseCreatePackageUpdateRequestParams = {
  packageId: number;
  accountProjectId: number;
  options?: Options;
};
export const useCreatePackageUpdateRequest = ({
  packageId,
  accountProjectId,
  options = {},
}: UseCreatePackageUpdateRequestParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPackageUpdateRequest,
    ...options,
    onSuccess: (submissionPackage) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }

      queryClient.setQueryData(
        [STAFF_QUERY_KEY.SUBMISSION_PACKAGE, packageId],
        submissionPackage,
      );
      queryClient.invalidateQueries({
        queryKey: [STAFF_QUERY_KEY.ACCOUNT_PROJECT, accountProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: [STAFF_QUERY_KEY.ACCOUNT_PROJECTS],
      });
    },
  });
};
