import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import {
  Submission,
  SUBMISSION_TYPE,
  SubmissionType,
} from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

type FormType = Record<string, unknown>;
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
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, submissionItem?.package_id],
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

type ReplaceSubmissionParams = {
  submissionId: number;
  data: FormType;
};
export const replacteSubmission = ({
  submissionId,
  data,
}: ReplaceSubmissionParams) => {
  return submitRequest<Submission>({
    url: `/submissions/${submissionId}/document`,
    method: "post",
    data,
  });
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
    mutationFn: (params: ReplaceSubmissionParams) => replacteSubmission(params),
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
