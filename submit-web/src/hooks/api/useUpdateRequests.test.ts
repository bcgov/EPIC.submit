import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSaveProponentNote } from "./useUpdateRequests";
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

describe("useSaveProponentNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the note to the update request note endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveProponentNote(), { wrapper });

    act(() => {
      result.current.mutate({
        packageId: 5,
        updateRequestId: 9,
        note: "hello",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/5/update-requests/9/note",
      method: "POST",
      data: { note: "hello" },
    });
  });

  it("invalidates the submission package query on success", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSaveProponentNote(), { wrapper });

    act(() => {
      result.current.mutate({ packageId: 5, updateRequestId: 9, note: "n" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 5],
    });
  });

  it("does not invalidate queries when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSaveProponentNote(), { wrapper });

    act(() => {
      result.current.mutate({ packageId: 5, updateRequestId: 9, note: "n" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
