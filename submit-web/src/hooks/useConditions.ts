import { conditionLibraryRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./api/constants";
import { ConditionsLibraryResponse } from "@/models/Condition";

type GetConditionParams = {
  conditionId: number;
};

const getCondition = ({ conditionId }: GetConditionParams) => {
  return conditionLibraryRequest<ConditionsLibraryResponse>({
    //replace with conditions api
    url: `conditions/${conditionId}`,
  });
};

type UseGetConditionParams = {
  conditionId: number;
  enabled?: boolean;
};

export const getConditionQueryOptions = ({
  conditionId,
  enabled = true,
}: UseGetConditionParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.SUBMISSION_ITEM, conditionId],
    queryFn: () => getCondition({ conditionId }),
    enabled: enabled && Boolean(conditionId),
  });

export const useGetCondition = ({
  conditionId,
  enabled = true,
}: UseGetConditionParams) => {
  const options = getConditionQueryOptions({ conditionId, enabled });
  return useQuery(options);
};
