import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useTermsOfServiceData } from "./useTermsOfService";

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

describe("useTermsOfServiceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the terms of service", async () => {
    const terms = { id: 1, content: "terms" };
    mockSubmitRequest.mockResolvedValue(terms);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTermsOfServiceData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(terms);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/terms-of-service",
    });
  });

  it("surfaces request errors", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTermsOfServiceData(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
