import { SubmissionItem } from "@/models/SubmissionItem";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";

type GetSubmissionItemByIdParams = {
  itemId: number;
};
const getSubmissionItemById = ({ itemId }: GetSubmissionItemByIdParams) => {
  return submitRequest<SubmissionItem>({
    url: `items/${itemId}`,
  });
};

type UseGetSubmissionItemByIdParams = {
  itemId: number;
  enabled?: boolean;
};

export const useGetSubmissionItem = ({
  itemId,
  enabled = true,
}: UseGetSubmissionItemByIdParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.SUBMISSION_ITEM, itemId],
    queryFn: () => getSubmissionItemById({ itemId }),
    enabled: enabled && Boolean(itemId),
  });
};
