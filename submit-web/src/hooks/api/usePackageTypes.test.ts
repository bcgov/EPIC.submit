import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getPackageTypesByPhaseIdQueryOptions,
  getPackageTypesByProjectIdQueryOptions,
  useGetPackageTypesByPhaseId,
  useGetPackageTypesByProjectId,
} from "./usePackageTypes";
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

describe("useGetPackageTypesByPhaseId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests package types for the phase", async () => {
    const types = [{ id: 1, name: "Type" }];
    mockSubmitRequest.mockResolvedValue(types);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetPackageTypesByPhaseId({ phaseId: 7 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "staff/package-types/phase/7",
    });
    expect(result.current.data).toEqual(types);
  });

  it("does not fetch when phaseId is missing", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetPackageTypesByPhaseId({ phaseId: undefined }), {
      wrapper,
    });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetPackageTypesByPhaseId({ phaseId: 7, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options with key, staleTime and enabled flag", () => {
    const options = getPackageTypesByPhaseIdQueryOptions({ phaseId: 3 });

    expect(options.queryKey).toEqual([QUERY_KEY.PACKAGE_TYPES, 3]);
    expect(options.staleTime).toBe(5 * 60 * 1000);
    expect(options.enabled).toBe(true);
  });
});

describe("useGetPackageTypesByProjectId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests package types for the project", async () => {
    const types = [{ id: 2, name: "Other" }];
    mockSubmitRequest.mockResolvedValue(types);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetPackageTypesByProjectId({ projectId: 12 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "staff/package-types/project/12",
    });
    expect(result.current.data).toEqual(types);
  });

  it("does not fetch when projectId is missing", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetPackageTypesByProjectId({ projectId: undefined }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetPackageTypesByProjectId({ projectId: 12, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options with project key and disabled without id", () => {
    const options = getPackageTypesByProjectIdQueryOptions({});

    expect(options.queryKey).toEqual([
      QUERY_KEY.PACKAGE_TYPES,
      "project",
      undefined,
    ]);
    expect(options.enabled).toBe(false);
  });

  it("exposes the error when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("boom"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetPackageTypesByProjectId({ projectId: 12 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
