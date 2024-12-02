import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import { STAFF_QUERY_KEY } from "./constants";
import { Note } from "@/components/SubmissionItem/ConsultationRecord/ConsultationRecordStaffView/Note";

type CreateNoteType = {
  submission_item_id: number;
  note: Partial<Note>;
};
export const createNote = ({ submission_item_id, note }: CreateNoteType) => {
  return submitRequest<Note>({
    url: `/staff/notes/submission-items/${submission_item_id}`,
    method: "post",
    data: note,
  });
};

type UseCreateNoteProps = {
  itemId: number;
  packageId: number;
  options?: Options;
};
export const useCreateNote = ({
  itemId,
  packageId,
  options,
}: UseCreateNoteProps) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNote,
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
