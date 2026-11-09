import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getActivityLogForAdminQueryOptions,
  getActivityLogForProponentQueryOptions,
  useGetActivityLog,
  useGetActivityLogForAdmin,
  useGetActivityLogForProponent,
} from "./useActivtyLog";
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

describe("getActivityLog query options", () => {
  it("builds admin options with key and enabled flag", () => {
    const options = getActivityLogForAdminQueryOptions({
      id: 1,
      entityType: "package",
    });
    expect(options.queryKey).toEqual([QUERY_KEY.ACTIVITY_LOGS, 1, "package"]);
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(false);
  });

  it("disables admin options when id is falsy", () => {
    const options = getActivityLogForAdminQueryOptions({
      id: 0,
      entityType: "package",
    });
    expect(options.enabled).toBe(false);
  });

  it("disables admin options when entityType is empty", () => {
    const options = getActivityLogForAdminQueryOptions({
      id: 1,
      entityType: "",
    });
    expect(options.enabled).toBe(false);
  });

  it("disables admin options when enabled is false", () => {
    const options = getActivityLogForAdminQueryOptions({
      id: 1,
      entityType: "package",
      enabled: false,
    });
    expect(options.enabled).toBe(false);
  });

  it("builds proponent options with key and enabled flag", () => {
    const options = getActivityLogForProponentQueryOptions({
      id: 2,
      entityType: "submission",
    });
    expect(options.queryKey).toEqual([
      QUERY_KEY.ACTIVITY_LOGS,
      2,
      "submission",
    ]);
    expect(options.enabled).toBe(true);
  });

  it("disables proponent options when enabled is false", () => {
    const options = getActivityLogForProponentQueryOptions({
      id: 2,
      entityType: "submission",
      enabled: false,
    });
    expect(options.enabled).toBe(false);
  });
});

describe("useGetActivityLogForAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the activity log for the entity", async () => {
    const logs = [{ id: 1 }];
    mockSubmitRequest.mockResolvedValue(logs);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetActivityLogForAdmin({ id: 7, entityType: "package" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(logs);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "activity-logs/package/7",
    });
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetActivityLogForAdmin({
          id: 7,
          entityType: "package",
          enabled: false,
        }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useGetActivityLogForProponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the activity log for the entity", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetActivityLogForProponent({ id: 8, entityType: "item" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "activity-logs/item/8",
    });
  });
});

describe("useGetActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the admin result when isAdmin is true", async () => {
    mockSubmitRequest.mockResolvedValue([{ id: 1 }]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetActivityLog({
          id: 3,
          entityType: "package",
          isAdmin: true,
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledTimes(1);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "activity-logs/package/3",
    });
  });

  it("returns the proponent result when isAdmin is false", async () => {
    mockSubmitRequest.mockResolvedValue([{ id: 2 }]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetActivityLog({
          id: 3,
          entityType: "package",
          enabled: true,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 2 }]);
    expect(mockSubmitRequest).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetActivityLog({
          id: 3,
          entityType: "package",
          enabled: false,
        }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});
