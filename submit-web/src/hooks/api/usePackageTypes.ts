import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { PackageType } from "@/models/Package";
import { submitRequest } from "@/utils/axiosUtils";

const getPackageTypesByPhaseId = async (phaseId: number): Promise<PackageType[]> => {
  return await submitRequest({
    method: "GET",
    url: `staff/package-types/phase/${phaseId}`,
  });
};

type UseGetPackageTypesByPhaseIdParams = {
  phaseId?: number;
  enabled?: boolean;
};

export const getPackageTypesByPhaseIdQueryOptions = ({
  phaseId,
  enabled = true,
}: UseGetPackageTypesByPhaseIdParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.PACKAGE_TYPES, phaseId],
    queryFn: () => getPackageTypesByPhaseId(phaseId!),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(phaseId),
  });

export const useGetPackageTypesByPhaseId = ({
  phaseId,
  enabled = true,
}: UseGetPackageTypesByPhaseIdParams) => {
  return useQuery(
    getPackageTypesByPhaseIdQueryOptions({
      phaseId,
      enabled,
    })
  );
};
