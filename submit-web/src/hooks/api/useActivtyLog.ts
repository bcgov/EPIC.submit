import { AcitivityLog } from "@/models/ActivityLog";
import { submitRequest } from "@/utils/axiosUtils";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";

type GetAcitivityLogForAdminByIdParams = {
  id: string;
  entityType: string;
};
const getAcitivityLogForAdminById = ({
  id,
  entityType,
}: GetAcitivityLogForAdminByIdParams) => {
  return submitRequest<AcitivityLog[]>({
    url: `staff/activity-logs/${entityType}/${id}`,
  });
};

type UseGetAcitivityLogForAdminByIdParams = {
  id: string;
  entityType: string;
  enabled?: boolean;
};

export const getAcitivityLogForAdminQueryOptions = ({
  id,
  entityType,
  enabled = true,
}: UseGetAcitivityLogForAdminByIdParams) =>
  queryOptions({
    queryKey: [QUERY_KEY.ACTIVITY_LOGS, id, entityType],
    queryFn: () => getAcitivityLogForAdminById({ id, entityType }),
    enabled: enabled && Boolean(id) && Boolean(entityType),
    retry: false,
  });

export const useGetAcitivityLogForAdmin = ({
  id,
  entityType,
  enabled = true,
}: UseGetAcitivityLogForAdminByIdParams) => {
  const options = getAcitivityLogForAdminQueryOptions({
    id,
    entityType,
    enabled,
  });
  return useQuery(options);
};
