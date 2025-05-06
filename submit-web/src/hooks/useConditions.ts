import { conditionLibraryRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./api/constants";
import { ConditionsLibraryResponse } from "@/models/Condition";

type GetConditionParams = {
  projectId: string;
  includeAttributes: boolean;
};

const getConditions = async ({
  projectId,
  includeAttributes,
}: GetConditionParams) => {
  const response = await conditionLibraryRequest<ConditionsLibraryResponse>({
    url: `/conditions/project/${projectId}?include_attributes=${includeAttributes}`,
  });

  // Extract and return only the `conditions` array
  return response.conditions;
};

type UseGetConditionParams = {
  projectId: string;
  enabled?: boolean;
  includeAttributes?: boolean;
};

export const getConditionsQueryOptions = ({
  projectId,
  includeAttributes = false,
  enabled = true,
}: UseGetConditionParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.SUBMISSION_ITEM, projectId],
    queryFn: async () => {
      const conditions = await getConditions({
        projectId,
        includeAttributes: includeAttributes,
      });
      return conditions.filter(
        (condition) =>
          condition.condition_attributes?.requires_management_plan === "true" ||
          condition.condition_attributes?.requires_iem_terms_of_engagement ===
            "true",
      );
    },
    enabled: enabled && Boolean(projectId),
  });

export const useGetConditions = ({
  projectId,
  includeAttributes = false,
  enabled = true,
}: UseGetConditionParams) => {
  const options = getConditionsQueryOptions({
    projectId,
    enabled,
    includeAttributes,
  });
  return useQuery(options);
};
