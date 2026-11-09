import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  createInternalStaffDocument,
  deleteInternalStaffDocument,
  useCreateInternalStaffDocument,
  useDeleteInternalStaffDocument,
} from "./useInternalStaffDocuments";
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

describe("createInternalStaffDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the document to the package endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });

    await createInternalStaffDocument({
      package_id: 7,
      document: { name: "doc" },
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/internal-staff-documents/packages/7",
      method: "post",
      data: { name: "doc" },
    });
  });
});

describe("deleteInternalStaffDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a delete request", async () => {
    mockSubmitRequest.mockResolvedValue(undefined);

    await deleteInternalStaffDocument({ documentId: 3 });

    expect(mockSubmitRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: "delete" }),
    );
  });
});

describe("useCreateInternalStaffDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates the package query and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useCreateInternalStaffDocument({ packageId: 9, options: { onSuccess } }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ package_id: 9, document: { name: "x" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 9],
    });
  });

  it("invalidates the package query when no options are given", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useCreateInternalStaffDocument({ packageId: 9 }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ package_id: 9, document: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onError and does not invalidate on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("boom"));
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useCreateInternalStaffDocument({ packageId: 9, options: { onError } }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ package_id: 9, document: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useDeleteInternalStaffDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates item and package queries and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useDeleteInternalStaffDocument({
          itemId: 4,
          packageId: 9,
          options: { onSuccess },
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ documentId: 2 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 4],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 9],
    });
  });

  it("invalidates queries when no options are given", async () => {
    mockSubmitRequest.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useDeleteInternalStaffDocument({ itemId: 4, packageId: 9 }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ documentId: 2 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("nope"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useDeleteInternalStaffDocument({
          itemId: 4,
          packageId: 9,
          options: { onError },
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ documentId: 2 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});
