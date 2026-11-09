import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getSubmittedDocumentsByPackageIdForStaffQueryOptions,
  getSubmittedDocumentsQueryOptions,
  useGetSubmittedDocuments,
} from "./useSubmittedDocuments";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
}));

import { submitRequest } from "@/utils/axiosUtils";

const mockSubmitRequest = vi.mocked(submitRequest);

type SerializerConfig = {
  url: string;
  params: Record<string, unknown>;
  paramsSerializer: (params: Record<string, unknown>) => string;
};

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

async function runQueryFn(options: { queryFn?: unknown }) {
  const fn = options.queryFn as () => Promise<unknown>;
  return fn();
}

describe("getSubmittedDocumentsQueryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds the query key from the search params", () => {
    const options = getSubmittedDocumentsQueryOptions({
      searchOptions: { a: "b" },
      projectId: 2,
      page: 1,
      size: 10,
    });

    expect(options.queryKey).toEqual([
      QUERY_KEY.ACCOUNT_PROJECTS,
      { a: "b" },
      2,
      1,
      10,
    ]);
  });

  it("requests /documents with merged params", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const options = getSubmittedDocumentsQueryOptions({
      searchOptions: { search_text: "abc" },
      projectId: 2,
      page: 3,
      size: 20,
    });

    await runQueryFn(options);

    const config = mockSubmitRequest.mock.calls[0][0] as unknown as SerializerConfig;
    expect(config.url).toBe("/documents");
    expect(config.params).toEqual({
      search_text: "abc",
      project_id: 2,
      page: 3,
      size: 20,
    });
  });

  it("serializes scalar, array and skips null/undefined params", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    await runQueryFn(getSubmittedDocumentsQueryOptions({ projectId: 1 }));

    const config = mockSubmitRequest.mock.calls[0][0] as unknown as SerializerConfig;
    const serialized = config.paramsSerializer({
      a: "x",
      b: ["1", "2"],
      c: undefined,
      d: null,
      e: 5,
    });

    expect(serialized).toBe("a=x&b=1&b=2&e=5");
  });
});

describe("useGetSubmittedDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches documents by default", async () => {
    mockSubmitRequest.mockResolvedValue([{ id: 1 }]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetSubmittedDocuments({ projectId: 5 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(mockSubmitRequest).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetSubmittedDocuments({ projectId: 5, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("getSubmittedDocumentsByPackageIdForStaffQueryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the package query key and zero stale time", () => {
    const options = getSubmittedDocumentsByPackageIdForStaffQueryOptions({
      packageId: "12",
    });

    expect(options.queryKey).toEqual([
      QUERY_KEY.PACKAGE_DOCUMENT_SUBMISSIONS,
      "12",
    ]);
    expect(options.staleTime).toBe(0);
  });

  it("requests the package submissions endpoint", async () => {
    mockSubmitRequest.mockResolvedValue([]);

    await runQueryFn(
      getSubmittedDocumentsByPackageIdForStaffQueryOptions({ packageId: "12" }),
    );

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/documents/submissions/packages/12",
    });
  });
});
