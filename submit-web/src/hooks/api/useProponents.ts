import { Proponent } from "@/models/Proponent";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";
import { useQuery } from "@tanstack/react-query";

const getProponents = () => {
  return submitRequest<Proponent[]>({
    url: `staff/proponents`,
  });
};

export const useProponents = () => {
  return useQuery({
    queryKey: [QUERY_KEY.PROPONENTS],
    queryFn: getProponents,
  });
};
