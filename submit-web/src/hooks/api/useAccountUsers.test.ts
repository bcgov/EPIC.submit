import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useGetAccountUsers,
  useSaveUserRole,
  useSaveUserStatus,
} from "./useAccountUsers";
import { QUERY_KEY } from "./constants";

// Mock the API calls
vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    isAxiosError: (e: any) => e?.isAxiosError === true,
  };
});

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

describe("useGetAccountUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the scoped list by default (no all_users param)", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountUsers({ accountId: 4 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/4/users",
    });
  });

  it("requests all users when allUsers is true", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountUsers({ accountId: 4, allUsers: true }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/4/users?all_users=true",
    });
  });

  it("does not fetch when accountId is missing", () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    renderHook(() => useGetAccountUsers({ accountId: undefined }), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useSaveUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates ACCOUNT_USERS and access-history queries on success", async () => {
    const updatedUser = { id: 10, full_name: "Updated" };
    mockSubmitRequest.mockResolvedValue(updatedUser);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useSaveUserRole({
          account_user_id: 10,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        role_name: "PROJECT_ADMIN",
        account_project_ids: [1, 2],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USERS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USER, 10, "access-history"],
    });
    expect(onSuccess).toHaveBeenCalledWith(updatedUser);
  });

  it("calls onError with parsed message on failure", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { message: "Role conflict" } },
    };
    mockSubmitRequest.mockRejectedValue(axiosError);

    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSaveUserRole({
          account_user_id: 10,
          options: { onError },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        role_name: "PROJECT_ADMIN",
        account_project_ids: [1],
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("useSaveUserStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates ACCOUNT_USERS and access-history queries on success", async () => {
    const updatedUser = { id: 10, full_name: "Updated", status: "INACTIVE" };
    mockSubmitRequest.mockResolvedValue(updatedUser);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useSaveUserStatus({
          account_user_id: 10,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: false });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USERS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USER, 10, "access-history"],
    });
    expect(onSuccess).toHaveBeenCalledWith(updatedUser);
  });

  it("calls onError with parsed message on failure", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { message: "Status update failed" } },
    };
    mockSubmitRequest.mockRejectedValue(axiosError);

    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () =>
        useSaveUserStatus({
          account_user_id: 10,
          options: { onError },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: true });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
