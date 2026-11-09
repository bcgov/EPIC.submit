import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useAddUser,
  useDeleteUser,
  useUpdateUser,
  useUserById,
  useUsersData,
} from "./useUsers";
import { User } from "@/models/User";

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

const user = { id: 4, first_name: "A" } as unknown as User;

describe("useUsersData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches all users", async () => {
    mockSubmitRequest.mockResolvedValue([user]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUsersData(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([user]);
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "/users" });
  });
});

describe("useUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a user by id", async () => {
    mockSubmitRequest.mockResolvedValue(user);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUserById(4), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "/users/4" });
  });

  it("does not fetch when id is falsy", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useUserById(0), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useAddUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the user and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue(user);
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const newUser = { first_name: "A" } as unknown as Omit<User, "id">;

    const { result } = renderHook(() => useAddUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(newUser);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/users",
      method: "post",
      data: newUser,
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useAddUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(user);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useUpdateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches the user and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue(user);
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useUpdateUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(user);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/users/4",
      method: "patch",
      data: user,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useUpdateUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(user);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
  });
});

describe("useDeleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the user and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useDeleteUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(4);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/users/4",
      method: "delete",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useDeleteUser(onSuccess, onError), {
      wrapper,
    });

    act(() => {
      result.current.mutate(4);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError).toHaveBeenCalled();
  });
});
