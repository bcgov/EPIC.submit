import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useCreateAccount,
  useGetUserByGuid,
  useGetUserByAccountId,
  getUserByGuid,
  getOrCreateCurrentUser,
  getUserByGuidQueryOptions,
  getAccount,
  getAccountQueryOptions,
} from "./useAccounts";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
}));

vi.mock("@/utils", () => ({
  getUserRolesFromToken: vi.fn(),
}));

import { submitRequest } from "@/utils/axiosUtils";
import { getUserRolesFromToken } from "@/utils";

const mockSubmitRequest = vi.mocked(submitRequest);
const mockGetRoles = vi.mocked(getUserRolesFromToken);

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

describe("useCreateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const account = {
    first_name: "A",
    last_name: "B",
    position: "P",
    work_contact_number: "123",
    work_email_address: "a@b.c",
    proponent_id: 1,
    auth_guid: "guid",
  };

  it("posts the account and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1, proponent_id: 1 });
    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateAccount({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(account);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts",
      method: "post",
      data: account,
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onSuccess.mock.calls[0][0]).toEqual({ id: 1, proponent_id: 1 });
  });

  it("calls onError when the request fails", async () => {
    const error = new Error("nope");
    mockSubmitRequest.mockRejectedValue(error);
    const onError = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateAccount({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(account).catch(() => undefined);
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBe(error);
  });
});

describe("getUserByGuid / getOrCreateCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves null without calling the API when no guid is given", async () => {
    await expect(getUserByGuid()).resolves.toBeNull();
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("requests the user by guid", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });

    await expect(getUserByGuid("abc")).resolves.toEqual({ id: 1 });
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "/users/guid/abc" });
  });

  it("posts to /users/me for the current user", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 2 });

    await expect(getOrCreateCurrentUser()).resolves.toEqual({ id: 2 });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/users/me",
      method: "post",
    });
  });
});

describe("getUserByGuidQueryOptions", () => {
  it("builds the query key and passes enabled through", () => {
    const options = getUserByGuidQueryOptions({ guid: "g", enabled: false });

    expect(options.queryKey).toEqual([QUERY_KEY.ACCOUNT_USER, "g"]);
    expect(options.enabled).toBe(false);
  });

  it("defaults enabled to false when undefined", () => {
    const options = getUserByGuidQueryOptions({ guid: "g" });

    expect(options.enabled).toBe(false);
  });

  it("queryFn fetches the user by guid", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 3 });
    const options = getUserByGuidQueryOptions({ guid: "g", enabled: true });

    const fn = options.queryFn as () => Promise<unknown>;
    await expect(fn()).resolves.toEqual({ id: 3 });
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "/users/guid/g" });
  });
});

describe("useGetUserByGuid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the user when a guid is provided", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetUserByGuid({ guid: "g1" }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "/users/guid/g1" });
    expect(result.current.data).toEqual({ id: 5 });
  });

  it("is disabled without a guid", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetUserByGuid({}), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useGetUserByAccountId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests account users with the include flags", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetUserByAccountId({
          accountId: 7,
          includeRoles: true,
          includeInvitees: false,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/7/users?include_invitees=false&include_roles=true",
    });
  });

  it("is disabled when accountId is falsy", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetUserByAccountId({
          accountId: 0,
          includeRoles: false,
          includeInvitees: false,
        }),
      { wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("getAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty object without a guid", async () => {
    await expect(getAccount()).resolves.toEqual({});
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("maps a proponent account user with de-duplicated permissions", async () => {
    mockSubmitRequest.mockResolvedValue({
      id: 10,
      account_user: {
        has_agreed_to_terms: true,
        account: { id: 20, proponent_id: 30 },
        roles: [
          { permissions: ["a", "b"] },
          { permissions: ["b", "c"] },
        ],
      },
    });

    const result = await getAccount("guid");

    expect(result).toEqual({
      userId: 10,
      isLoading: false,
      proponentId: 30,
      accountId: 20,
      userType: "PROPONENT",
      userManagementRoles: [
        { permissions: ["a", "b"] },
        { permissions: ["b", "c"] },
      ],
      roles: ["a", "b", "c"],
      hasAgreedToTerms: true,
    });
  });

  it("returns empty roles when the account user has no roles", async () => {
    mockSubmitRequest.mockResolvedValue({
      id: 10,
      account_user: {
        has_agreed_to_terms: false,
        account: { id: 20, proponent_id: 30 },
      },
    });

    const result = await getAccount("guid");

    expect(result.roles).toEqual([]);
    expect(result.hasAgreedToTerms).toBe(false);
  });

  it("maps a staff user using roles from the access token", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 11, staff_user: { id: 1 } });
    mockGetRoles.mockReturnValue(["staff_role"]);

    const result = await getAccount("guid", "token");

    expect(mockGetRoles).toHaveBeenCalledWith("token");
    expect(result).toEqual({
      userId: 11,
      isLoading: false,
      userType: "STAFF",
      roles: ["staff_role"],
    });
  });

  it("returns an error state for a staff user without an access token", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 11, staff_user: { id: 1 } });

    const result = await getAccount("guid");

    expect(result.isLoading).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Access token is required for staff user",
    );
  });

  it("returns empty roles for a user with neither account nor staff user", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 12 });

    await expect(getAccount("guid")).resolves.toEqual({
      roles: [],
      isLoading: false,
    });
  });

  it("returns empty roles when the user response is empty", async () => {
    mockSubmitRequest.mockResolvedValue(null);

    await expect(getAccount("guid")).resolves.toEqual({
      roles: [],
      isLoading: false,
    });
  });

  it("returns the error when the request fails", async () => {
    const error = new Error("network");
    mockSubmitRequest.mockRejectedValue(error);

    await expect(getAccount("guid")).resolves.toEqual({
      isLoading: false,
      error,
    });
  });
});

describe("getAccountQueryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds the query options", () => {
    const options = getAccountQueryOptions({
      guid: "g",
      accessToken: "t",
      enabled: true,
    });

    expect(options.queryKey).toEqual([QUERY_KEY.USER_ACCOUNT_DATA, "g"]);
    expect(options.enabled).toBe(true);
    expect(options.staleTime).toBe(0);
  });

  it("queryFn delegates to getAccount", async () => {
    const options = getAccountQueryOptions({ guid: undefined });

    await expect(options.queryFn()).resolves.toEqual({});
  });
});
