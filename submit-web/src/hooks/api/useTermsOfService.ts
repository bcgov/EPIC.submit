import { useQuery } from "@tanstack/react-query";
import { submitRequest } from "@/utils/axiosUtils";
import { QUERY_KEY } from "./constants";

const fetchTermsOfService = () => {
  return submitRequest({ url: "/terms-of-service" });
};

export const useTermsOfServiceData = () => {
  return useQuery({
    queryKey: [QUERY_KEY.TERMS_OF_SERVICE],
    queryFn: fetchTermsOfService,
  });
}
