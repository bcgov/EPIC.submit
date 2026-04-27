import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";

type SaveProponentNoteParams = {
  packageId: number;
  updateRequestId: number;
  note: string;
};

export const useSaveProponentNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packageId,
      updateRequestId,
      note,
    }: SaveProponentNoteParams) => {
      return submitRequest({
        url: `/packages/${packageId}/update-requests/${updateRequestId}/note`,
        method: "POST",
        data: { note },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, variables.packageId],
      });
    },
  });
};
