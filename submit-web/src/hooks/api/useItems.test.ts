import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getSubmissionItemForStaffQueryOptions,
  getSubmissionItemQueryOptions,
  saveSubmissionReview,
  undoStaffRecommendation,
  useGetSubmissionItem,
  useGetSubmissionItemForStaff,
  useSaveSubmissionReview,
  useUndoStaffRecommendation,
} from "./useItems";
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

const params = { itemId: 1, packageId: 2, accountProjectId: 3 };

describe("useGetSubmissionItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the item by id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetSubmissionItem({ itemId: 5 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "items/5" });
    expect(result.current.data).toEqual({ id: 5 });
  });

  it("does not fetch when itemId is falsy", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetSubmissionItem({ itemId: 0 }), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetSubmissionItem({ itemId: 5, enabled: false }), {
      wrapper,
    });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options keyed by item id", () => {
    const options = getSubmissionItemQueryOptions({ itemId: 5 });

    expect(options.queryKey).toEqual([QUERY_KEY.SUBMISSION_ITEM, 5]);
    expect(options.enabled).toBe(true);
  });
});

describe("useGetSubmissionItemForStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the item by id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 6 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetSubmissionItemForStaff({ itemId: 6 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "items/6" });
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetSubmissionItemForStaff({ itemId: 6, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options keyed by item id", () => {
    const options = getSubmissionItemForStaffQueryOptions({ itemId: 0 });

    expect(options.queryKey).toEqual([QUERY_KEY.SUBMISSION_ITEM, 0]);
    expect(options.enabled).toBe(false);
  });
});

describe("saveSubmissionReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the review data", async () => {
    mockSubmitRequest.mockResolvedValue({});

    await saveSubmissionReview(8, { status: "APPROVED", form_answers: {} });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/items/8/review",
      method: "post",
      data: { status: "APPROVED", form_answers: {} },
    });
  });
});

describe("undoStaffRecommendation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the review", async () => {
    mockSubmitRequest.mockResolvedValue({});

    await undoStaffRecommendation(8);

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/items/8/review",
      method: "delete",
    });
  });
});

describe("useSaveSubmissionReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the review and refreshes related queries", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useSaveSubmissionReview(params), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ form_answers: { a: 1 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/items/1/review",
      method: "post",
      data: { form_answers: { a: 1 } },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 1],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 2],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 3],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, 3],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.PACKAGE_VERSIONS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVITY_LOGS],
    });
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("does not refresh queries when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSaveSubmissionReview(params), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ form_answers: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useUndoStaffRecommendation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the review and refreshes related queries", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useUndoStaffRecommendation(params), {
      wrapper,
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/items/1/review",
      method: "delete",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 1],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 2],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 3],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, 3],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.PACKAGE_VERSIONS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVITY_LOGS],
    });
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });
});
