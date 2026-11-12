import { UploadDestination } from "@/models/documentUploadConfig";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import {
  Submission,
  SUBMISSION_TYPE,
  SubmissionStatus,
  SubmissionType,
} from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

type FormType = Record<string, unknown>;

type UseSaveSubmissionParams = {
  accountProjectId: number;
  submissionItem?: SubmissionItem;
  options?: Options;
};
export const useSaveSubmission = ({
  accountProjectId,
  submissionItem,
  options,
}: UseSaveSubmissionParams) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: FormType }) => {
      if (!submissionItem) {
        throw new Error("Submission item is required");
      }

      const formSubmission = submissionItem.submissions.find(
        (submission) => submission.type === SUBMISSION_TYPE.FORM,
      );
      if (formSubmission) {
        return editSubmissionForm(formSubmission.id, data);
      }
      return createSubmission(submissionItem.id, data);
    },
    ...options,
    onSuccess: (submission) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, submission.item_id],
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_PROJECT, accountProjectId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
      });
    },
  });
};

export const editSubmissionForm = (id: number, data: FormType) => {
  return submitRequest<Submission>({
    url: `/submissions/${id}/form`,
    method: "patch",
    data,
  });
};

export const createSubmission = (itemId: number, data: FormType) => {
  return submitRequest<Submission>({
    url: `/submissions/items/${itemId}`,
    method: "post",
    data,
  });
};

// Keep the folder and main/supporting priority tied to the same destination.
export const createDocumentSubmission = (
  itemId: number,
  destination: UploadDestination,
  document: { name: string; url: string },
) =>
  createSubmission(itemId, {
    type: SUBMISSION_TYPE.DOCUMENT,
    sort_order: destination.sortOrder,
    data: { ...document, folder: destination.value },
  });

// A document EAO staff add on behalf of the holder. The server stores it as
// uploaded by EAO and shows `receivedDate` (YYYY-MM-DD) as its Date Submitted.
export const createEaoDocumentSubmission = (
  itemId: number,
  destination: UploadDestination,
  document: { name: string; url: string },
  receivedDate: string,
) =>
  createSubmission(itemId, {
    type: SUBMISSION_TYPE.DOCUMENT,
    sort_order: destination.sortOrder,
    is_eao_upload: true,
    received_date: receivedDate,
    data: { ...document, folder: destination.value },
  });

export const useCreateSubmission = (itemId: number, options?: Options) => {
  return useMutation({
    mutationFn: ({ data }: { data: FormType }) =>
      createSubmission(itemId, data),
    ...options,
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    },
  });
};

export const useGetSubmissionsByItemIdAndType = ({
  itemId,
  type,
  enabled = true,
}: UseGetSubmissionItemByIdParams) => {
  return useQuery({
    queryKey: ["submissions", type],
    queryFn: () => getSubmissionsByItemIdAndType({ itemId }),
    enabled: enabled && Boolean(itemId),
    ...defaultUseQueryOptions,
  });
};

type GetSubmissionItemByIdParams = {
  itemId: number;
};
const getSubmissionsByItemIdAndType = ({
  itemId,
}: GetSubmissionItemByIdParams) => {
  return submitRequest<Submission[]>({
    url: `submissions/items/${itemId}`,
    params: {
      type: SUBMISSION_TYPE.DOCUMENT,
    },
  });
};

type UseGetSubmissionItemByIdParams = {
  itemId: number;
  type: SubmissionType;
  enabled?: boolean;
};

type UseReplaceSubmissionParams = {
  submissionPackageId: number;
} & Options;
export const useReplaceSubmussion = ({
  submissionPackageId,
  ...options
}: UseReplaceSubmissionParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ReplaceSubmissionParams) => replaceSubmission(params),
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, submissionPackageId],
      });
    },
    ...restOptions,
  });
};

type ReplaceSubmissionParams = {
  submissionId: number;
  data: FormType;
};
export const replaceSubmission = ({
  submissionId,
  data,
}: ReplaceSubmissionParams) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/document`,
    method: "post",
    data,
  });
};

type UseDeleteSubmissionParams = {
  submissionItemId: number;
} & Options;
export const useDeleteSubmission = ({
  submissionItemId,
  ...options
}: UseDeleteSubmissionParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubmission,
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, submissionItemId],
      });
    },
    ...restOptions,
  });
};

export const deleteSubmission = (submissionId: number) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/document`,
    method: "delete",
  });
};

type UseSoftDeleteSubmissionParams = {
  submissionItemId: number;
} & Options;
export const useSoftDeleteSubmission = ({
  submissionItemId,
  ...options
}: UseSoftDeleteSubmissionParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: softDeleteSubmission,
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, submissionItemId],
      });
    },
    ...restOptions,
  });
};

export const softDeleteSubmission = (submissionId: number) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/document/soft-delete`,
    method: "delete",
  });
};

export const useGetSubmissionVersions = (
  submissionId: number,
  packageId?: number,
) => {
  return useQuery({
    queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, submissionId, packageId],
    queryFn: () => getSubmissionVersions(submissionId, packageId),
    ...defaultUseQueryOptions,
    retry: false,
  });
};

export const getSubmissionVersions = (
  submissionId: number,
  packageId?: number,
) => {
  const params = packageId ? { package_id: packageId } : undefined;
  return submitRequest<Submission[]>({
    url: `/submissions/${submissionId}/versions`,
    params,
  });
};

export const getFailedSubmissionsByItemId = (submissionItemId: number) => {
  return submitRequest<Submission[]>({
    url: `/documents/failed/items/${submissionItemId}`,
  });
};

export const useGetFailedSubmissionsByItemId = (
  submissionItemId: number,
  options?: Options,
) => {
  return useQuery({
    queryKey: [QUERY_KEY.FAILED_SUBMISSIONS, submissionItemId],
    queryFn: () => getFailedSubmissionsByItemId(submissionItemId),
    enabled: Boolean(submissionItemId),
    ...defaultUseQueryOptions,
    ...options,
  });
};

type MoveSubmissionProps = {
  submissionId: number;
  newPath: string;
  targetSubmissionId?: number;
  destinationItemId: number;
  destinationFolder?: string;
  destinationSortOrder: number;
};
export const moveSubmission = ({
  submissionId,
  newPath,
  targetSubmissionId,
  destinationItemId,
  destinationFolder,
  destinationSortOrder,
}: MoveSubmissionProps) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/document/move`,
    method: "POST",
    data: {
      data: {
        destination_url: newPath,
        target_submission_id: targetSubmissionId,
        destination_item_id: destinationItemId,
        destination_folder: destinationFolder,
        destination_sort_order: destinationSortOrder,
      },
      type: SUBMISSION_TYPE.DOCUMENT,
    },
  });
};

type UseMoveSubmissionParams = {
  packageId?: number;
} & Options;
export const useMoveSubmission = ({
  packageId,
  ...options
}: UseMoveSubmissionParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveSubmission,
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      if (packageId) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
        });
      }
    },
    ...restOptions,
  });
};

export const triggerGeoProcess = (itemId: number) => {
  return submitRequest({
    url: `/submissions/items/${itemId}/geo-process`,
    method: "post",
  });
};

export const useTriggerGeoProcess = (options?: Options) => {
  const { onSuccess: _onSuccess, ...restOptions } = options || {};
  return useMutation({
    mutationFn: ({ itemId }: { itemId: number }) => triggerGeoProcess(itemId),
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
    },
    ...restOptions,
  });
};

export const updateSubmissionStatus = (
  submissionId: number,
  status: SubmissionStatus,
) => {
  return submitRequest({
    url: `/submissions/${submissionId}/status`,
    method: "PATCH",
    data: {
      status: status,
    },
  });
};

export const acknowledgeReportDocument = (submissionId: number) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/acknowledge`,
    method: "POST",
  });
};

type UseAcknowledgeReportDocumentParams = {
  packageId?: number;
} & Options;
export const useAcknowledgeReportDocument = ({
  packageId,
  ...options
}: UseAcknowledgeReportDocumentParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId }: { submissionId: number }) =>
      acknowledgeReportDocument(submissionId),
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
      });
    },
    ...restOptions,
  });
};

type useUpdateSubmissionStatusParams = {
  packageId?: number;
} & Options;
export const useUpdateSubmissionStatus = ({
  packageId,
  ...options
}: useUpdateSubmissionStatusParams) => {
  const { onSuccess: _onSuccess, ...restOptions } = options || {};
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      status,
    }: {
      submissionId: number;
      status: SubmissionStatus;
    }) => updateSubmissionStatus(submissionId, status),
    onSuccess: (data) => {
      if (_onSuccess) {
        _onSuccess(data);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, packageId],
      });
    },
    ...restOptions,
  });
};
