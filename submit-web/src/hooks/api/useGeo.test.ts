import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useGetGeoUploads,
  useRetryGeoUpload,
  useApproveGeoUpload,
  useCreateGeoUpload,
  useGetGeoUploadUrl,
  createGeoUpload,
  getGeoUploadUrl,
  GeoUpload,
} from "./useGeo";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
}));

import { submitRequest } from "@/utils/axiosUtils";

const mockSubmitRequest = vi.mocked(submitRequest);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const makeUpload = (overrides: Partial<GeoUpload> = {}): GeoUpload => ({
  id: 1,
  filename: "a.zip",
  file_type: "shapefile",
  file_size_kb: 10,
  status: "ready",
  is_approved: false,
  created_at: "2024-01-01",
  ...overrides,
});

describe("useGetGeoUploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests uploads with item and package ids as params", async () => {
    mockSubmitRequest.mockResolvedValue([makeUpload()]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 3, packageId: 5 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads",
      method: "get",
      params: { item_id: 3, package_id: 5 },
    });
    expect(result.current.data).toEqual([makeUpload()]);
  });

  it("requests uploads with undefined params when none are given", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetGeoUploads(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads",
      method: "get",
      params: { item_id: undefined, package_id: undefined },
    });
  });

  it("does not poll when autoRefetch is not set", async () => {
    mockSubmitRequest.mockResolvedValue([makeUpload({ status: "processing" })]);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 1 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEY.GEO_UPLOADS, 1, undefined] });
    const interval = (
      query?.observers[0].options.refetchInterval as (q: unknown) => unknown
    )(query);
    expect(interval).toBe(false);
  });

  it("polls every 3s when autoRefetch is set and an upload is processing", async () => {
    mockSubmitRequest.mockResolvedValue([makeUpload({ status: "processing" })]);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 1, autoRefetch: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEY.GEO_UPLOADS, 1, undefined] });
    const interval = (
      query?.observers[0].options.refetchInterval as (q: unknown) => unknown
    )(query);
    expect(interval).toBe(3000);
  });

  it("does not poll when autoRefetch is set but nothing is processing", async () => {
    mockSubmitRequest.mockResolvedValue([makeUpload({ status: "ready" })]);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 1, autoRefetch: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEY.GEO_UPLOADS, 1, undefined] });
    const interval = (
      query?.observers[0].options.refetchInterval as (q: unknown) => unknown
    )(query);
    expect(interval).toBe(false);
  });

  it("does not poll when there is no data and the query state is missing", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 2, autoRefetch: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEY.GEO_UPLOADS, 2, undefined] });
    const fn = query?.observers[0].options.refetchInterval as (
      q: unknown,
    ) => unknown;
    expect(fn({})).toBe(false);
  });

  it("surfaces request errors", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("boom"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetGeoUploads(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("allows options to override query defaults", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploads({ itemId: 1 }, { enabled: false }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useRetryGeoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts to the retry endpoint and invalidates geo uploads", async () => {
    mockSubmitRequest.mockResolvedValue(makeUpload());
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRetryGeoUpload(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(7);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads/7/retry",
      method: "post",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.GEO_UPLOADS],
    });
  });

  it("calls onError when the request fails", async () => {
    const error = new Error("fail");
    mockSubmitRequest.mockRejectedValue(error);
    const onError = vi.fn();
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRetryGeoUpload({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(7).catch(() => undefined);
    });

    expect(onError).toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useApproveGeoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts to the approve endpoint and invalidates geo uploads", async () => {
    mockSubmitRequest.mockResolvedValue(makeUpload({ is_approved: true }));
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useApproveGeoUpload(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(9);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads/9/approve",
      method: "post",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.GEO_UPLOADS],
    });
  });

  it("calls onError when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const onError = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useApproveGeoUpload({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(9).catch(() => undefined);
    });

    expect(onError).toHaveBeenCalled();
  });
});

describe("useCreateGeoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const params = {
    filename: "a.zip",
    file_type: "shapefile",
    file_size_kb: 10,
    s3_key: "geospatial/a.zip",
  };

  it("posts the payload and invalidates geo uploads", async () => {
    mockSubmitRequest.mockResolvedValue(makeUpload());
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateGeoUpload(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(params);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads",
      method: "post",
      data: params,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.GEO_UPLOADS],
    });
  });

  it("calls onError when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const onError = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateGeoUpload({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(params).catch(() => undefined);
    });

    expect(onError).toHaveBeenCalled();
  });

  it("createGeoUpload sends the data via submitRequest", async () => {
    mockSubmitRequest.mockResolvedValue(makeUpload());

    await createGeoUpload(params);

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads",
      method: "post",
      data: params,
    });
  });
});

describe("useGetGeoUploadUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the url when an upload id is provided", async () => {
    const response = {
      url: "https://x/y",
      bbox: [1, 2, 3, 4],
      feature_count: 1,
      geometry_type: "Point",
      crs_original: "EPSG:4326",
    };
    mockSubmitRequest.mockResolvedValue(response);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetGeoUploadUrl(4), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads/4/url",
      method: "get",
    });
    expect(result.current.data).toEqual(response);
  });

  it("is disabled when upload id is null", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetGeoUploadUrl(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("allows options to override enabled", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetGeoUploadUrl(4, { enabled: false }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("getGeoUploadUrl requests the url endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({});

    await getGeoUploadUrl(12);

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/geo/uploads/12/url",
      method: "get",
    });
  });
});
