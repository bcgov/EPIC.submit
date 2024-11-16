import { SubmissionItem } from "@/models/SubmissionItem";
import { submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY, STAFF_QUERY_KEY } from "./constants";

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

export const getSubmissionItemQueryOptions = ({
  itemId,
  enabled = true,
}: UseGetSubmissionItemByIdParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.SUBMISSION_ITEM, itemId],
    queryFn: () => getSubmissionItemById({ itemId }),
    enabled: enabled && Boolean(itemId),
  });

export const useGetSubmissionItem = ({
  itemId,
  enabled = true,
}: UseGetSubmissionItemByIdParams) => {
  const options = getSubmissionItemQueryOptions({ itemId, enabled });
  return useQuery(options);
};

/////////////
type GetSubmissionItemByIdForStaffParams = {
  itemId: number;
};
const getSubmissionItemByIdForStaff = ({
  itemId,
}: GetSubmissionItemByIdForStaffParams) => {
  return submitRequest<SubmissionItem>({
    url: `items/${itemId}`,
  });
};

type UseGetSubmissionItemByIdForStaffParams = {
  itemId: number;
  enabled?: boolean;
};

export const getSubmissionItemForStaffQueryOptions = ({
  itemId,
  enabled = true,
}: UseGetSubmissionItemByIdForStaffParams) =>
  queryOptions({
    queryKey: [STAFF_QUERY_KEY.SUBMISSION_ITEM, itemId],
    queryFn: () => getSubmissionItemByIdForStaff({ itemId }),
    enabled: enabled && Boolean(itemId),
  });

export const useGetSubmissionItemForStaff = ({
  itemId,
  enabled = true,
}: UseGetSubmissionItemByIdForStaffParams) => {
  const options = getSubmissionItemQueryOptions({ itemId, enabled });
  return useQuery(options);
};
