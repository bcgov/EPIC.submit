import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

vi.mock("@/utils/axiosUtils", () => ({
  conditionLibraryRequest: vi.fn(),
}));

import { conditionLibraryRequest } from "@/utils/axiosUtils";
import { getConditionsQueryOptions, useGetConditions } from "./useConditions";
import { QUERY_KEY } from "./api/constants";

const mockRequest = vi.mocked(conditionLibraryRequest);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

const conditions = [
  { id: 1, condition_attributes: { requires_management_plan: "true" } },
  { id: 2, condition_attributes: { requires_iem_terms_of_engagement: "true" } },
  { id: 3, condition_attributes: { requires_management_plan: "false" } },
  { id: 4 },
];

describe("getConditionsQueryOptions", () => {
  it("uses the submission item query key with the project id", () => {
    const options = getConditionsQueryOptions({ projectId: "5" });
    expect(options.queryKey).toEqual([QUERY_KEY.SUBMISSION_ITEM, "5"]);
  });

  it("is enabled by default when a project id is given", () => {
    expect(getConditionsQueryOptions({ projectId: "5" }).enabled).toBe(true);
  });

  it("is disabled when enabled is false", () => {
    expect(
      getConditionsQueryOptions({ projectId: "5", enabled: false }).enabled,
    ).toBe(false);
  });

  it("is disabled when the project id is empty", () => {
    expect(getConditionsQueryOptions({ projectId: "" }).enabled).toBe(false);
  });
});

describe("useGetConditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only conditions requiring a management plan or IEM terms", async () => {
    mockRequest.mockResolvedValue({ conditions });

    const { result } = renderHook(() => useGetConditions({ projectId: "5" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((c) => c.id)).toEqual([1, 2]);
  });

  it("requests attributes as false by default", async () => {
    mockRequest.mockResolvedValue({ conditions: [] });

    const { result } = renderHook(() => useGetConditions({ projectId: "5" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith({
      url: "/conditions/project/5?include_attributes=false",
    });
  });

  it("requests attributes when includeAttributes is true", async () => {
    mockRequest.mockResolvedValue({ conditions: [] });

    const { result } = renderHook(
      () => useGetConditions({ projectId: "7", includeAttributes: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRequest).toHaveBeenCalledWith({
      url: "/conditions/project/7?include_attributes=true",
    });
  });

  it("does not fetch when disabled", () => {
    renderHook(() => useGetConditions({ projectId: "5", enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
