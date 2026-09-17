import { publicRequest, submitRequest } from "@/utils/axiosUtils";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BannerConfiguration,
  BannerConfigurationPayload,
} from "@/models/BannerConfiguration";
import { QUERY_KEY } from "./constants";
import { Options } from "./types";

/**
 * Fetch the single active banner configuration for the public welcome page.
 * The API returns an empty object when nothing is active; normalize to null.
 */
const getActiveBanner = async (): Promise<BannerConfiguration | null> => {
  const data = await publicRequest<BannerConfiguration | Record<string, never>>(
    {
      method: "GET",
      url: "banner-configurations/active",
    },
  );
  if (!data || !("id" in data)) {
    return null;
  }
  return data as BannerConfiguration;
};

export const getActiveBannerQueryOptions = () =>
  queryOptions({
    queryKey: [QUERY_KEY.ACTIVE_BANNER_CONFIGURATION],
    queryFn: getActiveBanner,
    staleTime: 0,
  });

export const useGetActiveBanner = () => {
  return useQuery(getActiveBannerQueryOptions());
};

/**
 * Fetch the active banner configuration(s) for staff management. At most one
 * banner is ever active, so this returns an array of length 0 or 1.
 */
const getBannerConfigurations = async (): Promise<BannerConfiguration[]> => {
  return await submitRequest<BannerConfiguration[]>({
    method: "GET",
    url: "banner-configurations",
  });
};

export const getBannerConfigurationsQueryOptions = () =>
  queryOptions({
    queryKey: [QUERY_KEY.BANNER_CONFIGURATIONS],
    queryFn: getBannerConfigurations,
    staleTime: 0,
  });

export const useGetBannerConfigurations = () => {
  return useQuery(getBannerConfigurationsQueryOptions());
};

const createBannerConfiguration = ({
  data,
}: {
  data: BannerConfigurationPayload;
}) => {
  return submitRequest<BannerConfiguration>({
    url: "banner-configurations",
    method: "post",
    data,
  });
};

export const useCreateBannerConfiguration = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBannerConfiguration,
    ...options,
    onSuccess: (banner) => {
      if (options?.onSuccess) {
        options.onSuccess(banner);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.BANNER_CONFIGURATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACTIVE_BANNER_CONFIGURATION],
      });
    },
  });
};

const updateBannerConfiguration = ({
  bannerId,
  data,
}: {
  bannerId: number;
  data: Partial<BannerConfigurationPayload>;
}) => {
  return submitRequest<BannerConfiguration>({
    url: `banner-configurations/${bannerId}`,
    method: "put",
    data,
  });
};

export const useUpdateBannerConfiguration = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBannerConfiguration,
    ...options,
    onSuccess: (banner) => {
      if (options?.onSuccess) {
        options.onSuccess(banner);
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.BANNER_CONFIGURATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACTIVE_BANNER_CONFIGURATION],
      });
    },
  });
};
