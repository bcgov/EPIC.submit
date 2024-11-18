import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import { STAFF_QUERY_KEY } from "./constants";

type CreateInternalStaffDocumentFormType = {
  submission_item_id: number;
  document: Partial<InternalStaffDocument>;
};
export const createInternalStaffDocument = ({
  submission_item_id,
  document,
}: CreateInternalStaffDocumentFormType) => {
  return submitRequest<InternalStaffDocument>({
    url: `/staff/internal-staff-documents/submission-items/${submission_item_id}`,
    method: "post",
    data: document,
  });
};

type UseCreateInternalStaffDocumentProps = {
  itemId: number;
  packageId: number;
  options?: Options;
};
export const useCreateInternalStaffDocument = ({
  itemId,
  packageId,
  options,
}: UseCreateInternalStaffDocumentProps) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInternalStaffDocument,
    ...options,
    onSuccess: () => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      queryClient.invalidateQueries({
        queryKey: [STAFF_QUERY_KEY.SUBMISSION_ITEM, itemId],
      });
      queryClient.invalidateQueries({
        queryKey: [STAFF_QUERY_KEY.SUBMISSION_PACKAGE, packageId],
      });
    },
  });
};
