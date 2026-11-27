import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { NonWorkPackageMap } from "@/models/NonWorkPackageMap";
import { submitRequest } from "@/utils/axiosUtils";

const getNonWorkPackageMapsByProjectId = async (
  projectId: number,
): Promise<NonWorkPackageMap[]> => {
  return await submitRequest<NonWorkPackageMap[]>({
    method: "GET",
    url: `projects/${projectId}/non-work-package-maps`,
  });
};

type UseGetNonWorkPackageMapsByProjectIdParams = {
  projectId?: number;
  enabled?: boolean;
};

export const getNonWorkPackageMapsByProjectIdQueryOptions = ({
  projectId,
  enabled = true,
}: UseGetNonWorkPackageMapsByProjectIdParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.NON_WORK_PACKAGE_MAPS, projectId],
    queryFn: () => getNonWorkPackageMapsByProjectId(projectId!),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(projectId),
  });

/** Non-work package maps (e.g. Management Plan, Report) the project is eligible for. */
export const useGetNonWorkPackageMapsByProjectId = ({
  projectId,
  enabled = true,
}: UseGetNonWorkPackageMapsByProjectIdParams) => {
  return useQuery(getNonWorkPackageMapsByProjectIdQueryOptions({ projectId, enabled }));
};
