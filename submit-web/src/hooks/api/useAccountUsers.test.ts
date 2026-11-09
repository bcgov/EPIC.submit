import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  editUserProfile,
  editUserRole,
  editUserStatus,
  useAccountGetUserByGuid,
  useGetAccessHistory,
  useGetAccountUserById,
  useGetAccountUsers,
  useRecordUserTermsOfService,
  useSaveUserProfile,
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

describe("useGetAccountUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the account user by id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 6 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountUserById({ accountUserId: 6 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/users/6",
    });
  });

  it("does not fetch when accountUserId is missing", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetAccountUserById({}), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useAccountGetUserByGuid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the user profile by guid", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAccountGetUserByGuid({ guid: "g1" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/g1",
    });
  });

  it("does not fetch when guid is missing", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useAccountGetUserByGuid({}), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("edit request helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRequest.mockResolvedValue({});
  });

  it("editUserProfile patches the profile by guid", async () => {
    const data = {
      first_name: "A",
      last_name: "B",
      position: "P",
      work_contact_number: "123",
      work_email_address: "a@b.com",
    };
    await editUserProfile("g1", data);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/g1",
      method: "patch",
      data,
    });
  });

  it("editUserRole patches the role", async () => {
    const data = { role_name: "X", account_project_ids: [1] };
    await editUserRole(3, data);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/3/role",
      method: "patch",
      data,
    });
  });

  it("editUserStatus patches the status", async () => {
    await editUserStatus(3, { active: false });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/3/status",
      method: "patch",
      data: { active: false },
    });
  });
});

describe("useSaveUserProfile", () => {
  const profile = {
    first_name: "A",
    last_name: "B",
    position: "P",
    work_contact_number: "123",
    work_email_address: "a@b.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the profile, invalidates queries and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useSaveUserProfile({ guid: "g1", options: { onSuccess } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate(profile);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/g1",
      method: "patch",
      data: profile,
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USER, "g1"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USERS, "g1"],
    });
  });

  it("succeeds without options", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveUserProfile({ guid: "g1" }), {
      wrapper,
    });

    act(() => {
      result.current.mutate(profile);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("errors without calling the API when guid is empty", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveUserProfile({ guid: "" }), {
      wrapper,
    });

    act(() => {
      result.current.mutate(profile);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("GUID is required");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useSaveUserRole extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the server message to onError", async () => {
    mockSubmitRequest.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Role conflict" } },
    });
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSaveUserRole({ account_user_id: 10, options: { onError } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError.mock.calls[0][0].message).toBe("Role conflict");
  });
});

describe("useSaveUserRole extra branches (defaults)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the default message for non-axios errors", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("plain"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSaveUserRole({ account_user_id: 10, options: { onError } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError.mock.calls[0][0].message).toBe(
      "An error occurred while updating the user role.",
    );
  });

  it("uses the default message when the axios response has no message", async () => {
    mockSubmitRequest.mockRejectedValue({
      isAxiosError: true,
      response: { data: {} },
    });
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSaveUserRole({ account_user_id: 10, options: { onError } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError.mock.calls[0][0].message).toBe(
      "An error occurred while updating the user role.",
    );
  });

  it("handles error and success without options", async () => {
    mockSubmitRequest.mockRejectedValueOnce(new Error("x"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSaveUserRole({ account_user_id: 10 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    mockSubmitRequest.mockResolvedValueOnce({ id: 1 });
    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("errors without calling the API when account_user_id is 0", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSaveUserRole({ account_user_id: 0 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ role_name: "X", account_project_ids: [] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Account user id is required");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useSaveUserStatus extra branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches the status endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 10 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSaveUserStatus({ account_user_id: 10 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/10/status",
      method: "patch",
      data: { active: false },
    });
  });

  it("uses the default message for non-axios errors", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("plain"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSaveUserStatus({ account_user_id: 10, options: { onError } }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(onError.mock.calls[0][0].message).toBe(
      "An error occurred while updating the user status.",
    );
  });

  it("does not throw on error when no options are given", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("x"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSaveUserStatus({ account_user_id: 10 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("errors without calling the API when account_user_id is 0", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useSaveUserStatus({ account_user_id: 0 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ active: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Account user id is required");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useRecordUserTermsOfService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches terms acceptance without account_user_id in the body", async () => {
    mockSubmitRequest.mockResolvedValue({ ok: true });
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useRecordUserTermsOfService({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        account_user_id: 12,
        terms_of_service_version_id: 3,
        has_agreed_to_terms: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/12/terms-of-service",
      method: "patch",
      data: { terms_of_service_version_id: 3, has_agreed_to_terms: true },
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("works without options", async () => {
    mockSubmitRequest.mockResolvedValue({ ok: true });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecordUserTermsOfService(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        account_user_id: 12,
        terms_of_service_version_id: null,
        has_agreed_to_terms: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useGetAccessHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches access history for the account user", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccessHistory({ accountUserId: 9 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/user/9/access-history",
    });
  });

  it("does not fetch when accountUserId is null", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetAccessHistory({ accountUserId: null }), {
      wrapper,
    });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});
