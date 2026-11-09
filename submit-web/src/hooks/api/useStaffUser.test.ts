import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useStaffAddUser, useStaffUserById } from "./useStaffUser";

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

describe("useStaffUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the staff user by guid", async () => {
    const user = { id: 1 };
    mockSubmitRequest.mockResolvedValue(user);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStaffUserById("abc-123"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(user);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "staff-user/abc-123",
    });
  });

  it("does not fetch when userId is missing", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useStaffUserById(undefined), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("surfaces request errors", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStaffUserById("abc"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useStaffAddUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the staff user payload", async () => {
    const created = { id: 2 };
    mockSubmitRequest.mockResolvedValue(created);
    const { wrapper } = createWrapper();
    const data = {
      first_name: "A",
      last_name: "B",
      work_email_address: "a@b.com",
      auth_guid: "guid",
    };

    const { result } = renderHook(() => useStaffAddUser(), { wrapper });

    act(() => {
      result.current.mutate(data);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "staff-user",
      method: "post",
      data,
    });
    expect(result.current.data).toEqual(created);
  });

  it("reports an error when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStaffAddUser(), { wrapper });

    act(() => {
      result.current.mutate({});
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
