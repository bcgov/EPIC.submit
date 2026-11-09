import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getProponentOptions,
  useEnableProponentProject,
  useGetAllProponents,
  useGetProponent,
  useGetProponents,
} from "./useProponents";
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

describe("useGetProponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests proponents with approved-conditions param", async () => {
    mockSubmitRequest.mockResolvedValue([{ id: 1 }]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetProponents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents",
      params: { "approved-conditions": "true" },
    });
  });
});

describe("useGetAllProponents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests all proponents without params", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetAllProponents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "proponents" });
  });
});

describe("useGetProponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a proponent with no params by default", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetProponent(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents/5",
      params: {},
    });
  });

  it("maps every include option to its query param", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetProponent(5, {
          includeProjects: true,
          includeInvitations: true,
          includeEligibilityEntries: true,
          includeAdministrators: true,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents/5",
      params: {
        "include-projects": "true",
        "include-invitations": "true",
        "include-eligibility-entries": "true",
        "include-administrators": "true",
      },
    });
  });

  it("omits params for options set to false", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetProponent(5, { includeProjects: true, includeInvitations: false }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents/5",
      params: { "include-projects": "true" },
    });
  });

  it("does not fetch when proponentId is falsy", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetProponent(0), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("respects enabled false from query options", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetProponent(5, {}, { enabled: false }), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("fetches when enabled true is passed even with falsy id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 0 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetProponent(0, {}, { enabled: true }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledTimes(1);
  });
});

describe("getProponentOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a query key including id and options", () => {
    const opts = { includeProjects: true };
    expect(getProponentOptions(3, opts).queryKey).toEqual([
      QUERY_KEY.PROPONENT,
      3,
      opts,
    ]);
  });

  it("converts a string id to a number in the request", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 3 });

    await getProponentOptions("3").queryFn();

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents/3",
      params: {},
    });
  });
});

describe("useEnableProponentProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts eligibility entry ids and calls onSuccess", async () => {
    const proponent = { id: 5 };
    mockSubmitRequest.mockResolvedValue(proponent);
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useEnableProponentProject({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ proponentId: 5, projectIds: [1, "2"] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "proponents/5/projects",
      method: "post",
      data: { eligibility_entry_ids: [1, "2"] },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onSuccess.mock.calls[0][0]).toEqual(proponent);
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("nope"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useEnableProponentProject({ onError }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ proponentId: 5, projectIds: [1] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
  });
});
