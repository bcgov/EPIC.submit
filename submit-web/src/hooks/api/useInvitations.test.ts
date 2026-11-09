import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useCreateInvitationToExistingProject,
  useCreateNewAccountProjectInvitation,
  useGetInvitation,
  useGetInvitationByToken,
  useAcceptInvitation,
  useResendInvitation,
  useRevokeInvitation,
  useRenewInvitation,
  useGetInvitationProponent,
} from "./useInvitations";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({
  submitRequest: vi.fn(),
  publicRequest: vi.fn(),
}));

vi.mock("@/store/accountStore", () => ({
  useAccount: vi.fn(() => ({ accountId: 42 })),
}));

import { submitRequest, publicRequest } from "@/utils/axiosUtils";

const mockSubmitRequest = vi.mocked(submitRequest);
const mockPublicRequest = vi.mocked(publicRequest);

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

describe("useCreateInvitationToExistingProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the invitation payload", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateInvitationToExistingProject(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        account_id: 1,
        proponent_id: 2,
        role_name: "ADMIN",
        email: "a@b.c",
        account_project_ids: [3],
        project_ids: [4],
        original_package_ids: [5],
      });
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations",
      method: "post",
      data: {
        account_id: 1,
        proponent_id: 2,
        role_name: "ADMIN",
        email: "a@b.c",
        account_project_ids: [3],
        project_ids: [4],
        original_package_ids: [5],
      },
    });
  });

  it("calls onSuccess and onError callbacks", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCreateInvitationToExistingProject({ onSuccess, onError }),
      { wrapper },
    );
    const vars = {
      account_id: 1,
      proponent_id: 2,
      role_name: "ADMIN",
      email: "a@b.c",
    };

    mockSubmitRequest.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      await result.current.mutateAsync(vars);
    });
    expect(onSuccess).toHaveBeenCalled();

    mockSubmitRequest.mockRejectedValueOnce(new Error("bad"));
    await act(async () => {
      await result.current.mutateAsync(vars).catch(() => undefined);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe("useCreateNewAccountProjectInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRequest.mockResolvedValue({});
  });

  it("sends eligible_entries when provided", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateNewAccountProjectInvitation(), {
      wrapper,
    });
    const entries = [{ project_id: 1, work_ids: [2] }];

    await act(async () => {
      await result.current.mutateAsync({
        proponent_id: 1,
        role_name: "ADMIN",
        eligible_entries: entries,
        project_ids: [9],
      });
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/account",
      method: "post",
      data: { proponent_id: 1, role_name: "ADMIN", eligible_entries: entries },
    });
  });

  it("falls back to legacy project_ids", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateNewAccountProjectInvitation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        proponent_id: 1,
        role_name: "ADMIN",
        project_ids: [9, "10"],
      });
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/account",
      method: "post",
      data: { proponent_id: 1, role_name: "ADMIN", project_ids: [9, "10"] },
    });
  });

  it("sends only proponent and role when no projects are given", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateNewAccountProjectInvitation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ proponent_id: 1, role_name: "ADMIN" });
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/account",
      method: "post",
      data: { proponent_id: 1, role_name: "ADMIN" },
    });
  });
});

describe("useGetInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the invitation by token when enabled", async () => {
    mockPublicRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitation("tok", true), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPublicRequest).toHaveBeenCalledWith({ url: "/invitations/tok" });
    expect(result.current.data).toEqual({ id: 1 });
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitation("tok", false), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockPublicRequest).not.toHaveBeenCalled();
  });
});

describe("useGetInvitationByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the invitation when a token exists", async () => {
    mockPublicRequest.mockResolvedValue({ id: 2 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitationByToken("tok2"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPublicRequest).toHaveBeenCalledWith({
      url: "/invitations/tok2",
    });
  });

  it("is disabled for an empty token", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitationByToken(""), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockPublicRequest).not.toHaveBeenCalled();
  });
});

describe("useAcceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const data = {
    first_name: "A",
    last_name: "B",
    position: "P",
    work_contact_number: "1",
    work_email_address: "a@b.c",
    proponent_id: 1,
    auth_guid: "g",
    terms_of_service_version_id: 1,
    has_agreed_to_terms: true,
  };

  it("posts the account data to the token url", async () => {
    const response = { message: "ok", user_id: 1, roles: [], account_id: 2 };
    mockSubmitRequest.mockResolvedValue(response);
    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAcceptInvitation({ token: "tok", onSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(data);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/tok",
      method: "post",
      data,
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("rejects and calls onError when the token is missing", async () => {
    const onError = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAcceptInvitation({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(data).catch(() => undefined);
    });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect((onError.mock.calls[0][0] as Error).message).toBe(
      "Token is required",
    );
  });
});

describe("useResendInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts to the resend endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useResendInvitation({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(8);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/id/8/resend",
      method: "post",
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe("useRevokeInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the invitation and invalidates account users", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const onSuccess = vi.fn();
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRevokeInvitation({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(3);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/id/3",
      method: "delete",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_USERS, 42],
    });
  });

  it("invalidates account users without an onSuccess option", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRevokeInvitation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(3);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onError and does not invalidate on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("x"));
    const onError = vi.fn();
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRevokeInvitation({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(3).catch(() => undefined);
    });

    expect(onError).toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useRenewInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches the renew endpoint", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRenewInvitation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(6);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/invitations/id/6/renew",
      method: "patch",
    });
  });
});

describe("useGetInvitationProponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the proponent for the invitation token", async () => {
    const proponent = { id: 1, name: "P", eligibility_entries: [] };
    mockPublicRequest.mockResolvedValue(proponent);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitationProponent("tok"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPublicRequest).toHaveBeenCalledWith({
      url: "/invitations/tok/proponent",
    });
    expect(result.current.data).toEqual(proponent);
  });

  it("is disabled without a token", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetInvitationProponent(), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockPublicRequest).not.toHaveBeenCalled();
  });
});
