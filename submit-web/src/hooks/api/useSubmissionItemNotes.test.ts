import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { createNote, useCreateNote } from "./useSubmissionItemNotes";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
}));

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

import { submitRequest } from "@/utils/axiosUtils";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

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

describe("createNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the note to the submission item notes endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });

    await createNote({ submission_item_id: 4, note: { note: "hi" } });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/notes/submission-items/4",
      method: "post",
      data: { note: "hi" },
    });
  });
});

describe("useCreateNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies, calls onSuccess and invalidates item and package queries", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateNote({ itemId: 2, packageId: 3, options: { onSuccess } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ submission_item_id: 2, note: { note: "n" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith("Note added successfully");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 2],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 3],
    });
  });

  it("succeeds without options", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreateNote({ itemId: 2, packageId: 3 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ submission_item_id: 2, note: { note: "n" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(notify.success).toHaveBeenCalled();
  });

  it("calls onError and skips success handling when the request fails", async () => {
    const error = new Error("fail");
    mockSubmitRequest.mockRejectedValue(error);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onError = vi.fn();

    const { result } = renderHook(
      () => useCreateNote({ itemId: 2, packageId: 3, options: { onError } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ submission_item_id: 2, note: { note: "n" } });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
    expect(notify.success).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
