import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { Options } from "./types";

export interface GeoUpload {
  id: number;
  filename: string;
  file_type: string;
  file_size_mb: number;
  status: string;
  feature_count?: number;
  geometry_type?: string;
  crs_original?: string;
  created_at: string;
  raw_s3_key?: string;
}

export interface CreateGeoUploadParams {
  filename: string;
  file_type: string;
  file_size_mb: number;
  s3_key: string;
}

export interface GeoUploadUrlResponse {
  url: string;
  bbox: number[];
  feature_count: number;
  geometry_type: string;
  crs_original: string;
}

/**
 * Hook to fetch the latest geospatial uploads.
 */
export const useGetGeoUploads = (params?: { itemId?: number }, options?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY.GEO_UPLOADS, params?.itemId],
    queryFn: () => getGeoUploads(params?.itemId),
    refetchInterval: (query: any) => {
      const data = query.state?.data as GeoUpload[] | undefined;
      const hasProcessing = data?.some((u) => u.status === "processing");
      return hasProcessing ? 3000 : false;
    },
    ...defaultUseQueryOptions,
    ...options,
  });
};

const getGeoUploads = (itemId?: number) => {
  return submitRequest<GeoUpload[]>({
    url: "/geo/uploads",
    method: "get",
    params: { item_id: itemId }
  });
};

/**
 * Hook to retry a failed geospatial upload.
 */
export const useRetryGeoUpload = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uploadId: number) => retryGeoUpload(uploadId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.GEO_UPLOADS] });
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    ...options,
  });
};

const retryGeoUpload = (uploadId: number) => {
  return submitRequest<GeoUpload>({
    url: `/geo/uploads/${uploadId}/retry`,
    method: "post",
  });
};

/**
 * Hook to create a new geospatial upload and trigger processing.
 */
export const useCreateGeoUpload = (options?: Options) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGeoUploadParams) => createGeoUpload(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.GEO_UPLOADS] });
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    ...options,
  });
};

export const createGeoUpload = (data: CreateGeoUploadParams) => {
  return submitRequest<GeoUpload>({
    url: "/geo/uploads",
    method: "post",
    data,
  });
};

export const useGetGeoUploadUrl = (uploadId: number | null, options?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY.GEO_UPLOADS, uploadId, "url"],
    queryFn: () => getGeoUploadUrl(uploadId!),
    enabled: Boolean(uploadId),
    ...defaultUseQueryOptions,
    ...options,
  });
};

export const getGeoUploadUrl = (uploadId: number) => {
  return submitRequest<GeoUploadUrlResponse>({
    url: `/geo/uploads/${uploadId}/url`,
    method: "get",
  });
};
