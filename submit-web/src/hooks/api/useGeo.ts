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

/**
 * Hook to fetch the latest geospatial uploads.
 */
export const useGetGeoUploads = (options?: any) => {
  return useQuery({
    queryKey: [QUERY_KEY.GEO_UPLOADS],
    queryFn: () => getGeoUploads(),
    ...defaultUseQueryOptions,
    ...options,
  });
};

const getGeoUploads = () => {
  return submitRequest<GeoUpload[]>({
    url: "/geo/uploads",
    method: "get",
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
