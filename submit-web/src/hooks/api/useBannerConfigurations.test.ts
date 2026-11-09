import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getActiveBannerQueryOptions,
  getBannerConfigurationsQueryOptions,
  useCreateBannerConfiguration,
  useGetActiveBanner,
  useGetBannerConfigurations,
  useUpdateBannerConfiguration,
} from "./useBannerConfigurations";
import { QUERY_KEY } from "./constants";
import { BannerConfigurationPayload } from "@/models/BannerConfiguration";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
  publicRequest: vi.fn(),
}));

import { publicRequest, submitRequest } from "@/utils/axiosUtils";

const mockSubmitRequest = vi.mocked(submitRequest);
const mockPublicRequest = vi.mocked(publicRequest);

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

const payload = { message: "Hello" } as unknown as BannerConfigurationPayload;

describe("useGetActiveBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the banner when the response has an id", async () => {
    const banner = { id: 3, message: "Hi" };
    mockPublicRequest.mockResolvedValue(banner);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetActiveBanner(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(banner);
    expect(mockPublicRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "banner-configurations/active",
    });
  });

  it("normalizes an empty object to null", async () => {
    mockPublicRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetActiveBanner(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("normalizes a falsy response to null", async () => {
    mockPublicRequest.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetActiveBanner(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("exposes the expected query key", () => {
    expect(getActiveBannerQueryOptions().queryKey).toEqual([
      QUERY_KEY.ACTIVE_BANNER_CONFIGURATION,
    ]);
  });
});

describe("useGetBannerConfigurations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches banner configurations", async () => {
    const banners = [{ id: 1 }];
    mockSubmitRequest.mockResolvedValue(banners);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetBannerConfigurations(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(banners);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "banner-configurations",
    });
  });

  it("exposes the expected query key", () => {
    expect(getBannerConfigurationsQueryOptions().queryKey).toEqual([
      QUERY_KEY.BANNER_CONFIGURATIONS,
    ]);
  });
});

describe("useCreateBannerConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the payload and invalidates banner queries, calling onSuccess", async () => {
    const created = { id: 9 };
    mockSubmitRequest.mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateBannerConfiguration({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ data: payload });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "banner-configurations",
      method: "post",
      data: payload,
    });
    expect(onSuccess).toHaveBeenCalledWith(created);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.BANNER_CONFIGURATIONS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVE_BANNER_CONFIGURATION],
    });
  });

  it("invalidates queries when no options are provided", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateBannerConfiguration(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ data: payload });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("calls onError and skips invalidation on failure", async () => {
    const error = new Error("boom");
    mockSubmitRequest.mockRejectedValue(error);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onError = vi.fn();

    const { result } = renderHook(
      () => useCreateBannerConfiguration({ onError }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ data: payload });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useUpdateBannerConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts the payload to the banner url and invalidates banner queries", async () => {
    const updated = { id: 5 };
    mockSubmitRequest.mockResolvedValue(updated);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useUpdateBannerConfiguration({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ bannerId: 5, data: payload });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "banner-configurations/5",
      method: "put",
      data: payload,
    });
    expect(onSuccess).toHaveBeenCalledWith(updated);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.BANNER_CONFIGURATIONS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVE_BANNER_CONFIGURATION],
    });
  });

  it("invalidates queries when no options are provided", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateBannerConfiguration(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ bannerId: 5, data: {} });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useUpdateBannerConfiguration({ onError }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ bannerId: 5, data: {} });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
  });
});
