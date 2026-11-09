import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getAccountPackagesByAccountIdQueryOptions,
  getAccountProjectForStaffQueryOptions,
  getAccountProjectQueryOptions,
  getAccountProjects,
  getAccountProjectsByAccountQueryOptions,
  getAccountProjectsByUserQueryOptions,
  getAccountProjectsQueryOptions,
  useAddProjects,
  useGetAccountPackagesByAccountId,
  useGetAccountProject,
  useGetAccountProjectForStaff,
  useGetAccountProjects,
  useGetAccountProjectsByAccount,
  useGetAccountProjectsByUserId,
  useLoadProjectsByProponentId,
} from "./useProjects";
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

describe("useLoadProjectsByProponentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests projects for the proponent", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLoadProjectsByProponentId(8), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects/proponents/8",
    });
  });

  it("does not fetch without a proponent id", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useLoadProjectsByProponentId(undefined), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("rejects when the query function runs without a proponent id", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useLoadProjectsByProponentId(), {
      wrapper,
    });

    let refetched: Awaited<ReturnType<typeof result.current.refetch>> | undefined;
    await act(async () => {
      refetched = await result.current.refetch();
    });

    expect(refetched?.error?.message).toBe("Proponent ID is required");
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useAddProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts project ids to the account and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useAddProjects({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ accountId: 3, projectIds: [1, 2] });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects/accounts/3",
      method: "post",
      data: { project_ids: [1, 2] },
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(() => useAddProjects({ onError }), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ accountId: 3, projectIds: [] });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe("account projects by account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests account projects with search params", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetAccountProjectsByAccount({
          accountId: 4,
          searchOptions: { q: "x" },
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects/accounts/4",
      params: { q: "x" },
    });
  });

  it("is disabled without an account id", () => {
    const options = getAccountProjectsByAccountQueryOptions({
      accountId: null,
    });

    expect(options.enabled).toBe(false);
    expect(options.staleTime).toBe(0);
  });

  it("lets customQueryOptions override defaults", () => {
    const options = getAccountProjectsByAccountQueryOptions({
      accountId: 1,
      customQueryOptions: { enabled: false },
    });

    expect(options.enabled).toBe(false);
  });
});

describe("account project by id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the project by id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 5 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountProject({ accountProjectId: 5 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "projects/5" });
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetAccountProject({ accountProjectId: 5, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("is disabled when the id is missing", () => {
    expect(getAccountProjectQueryOptions(undefined).enabled).toBe(false);
    expect(getAccountProjectQueryOptions(null).enabled).toBe(false);
    expect(getAccountProjectQueryOptions(3).enabled).toBe(true);
  });

  it("builds the query key", () => {
    expect(getAccountProjectQueryOptions(3).queryKey).toEqual([
      QUERY_KEY.ACCOUNT_PROJECT,
      3,
    ]);
  });
});

describe("account project for staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the project by id", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 6 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountProjectForStaff({ accountProjectId: 6 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "projects/6" });
  });

  it("does not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetAccountProjectForStaff({ accountProjectId: 6, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("is disabled when the id is falsy", () => {
    expect(getAccountProjectForStaffQueryOptions(0).enabled).toBe(false);
    expect(getAccountProjectForStaffQueryOptions(2).enabled).toBe(true);
  });
});

describe("account projects (paginated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps page and pageSize to API params", async () => {
    mockSubmitRequest.mockResolvedValue({ projects: [] });

    await getAccountProjects({
      searchOptions: { q: "z" },
      page: 2,
      pageSize: 25,
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects",
      params: { q: "z", page: 2, page_size: 25 },
    });
  });

  it("fetches through the hook", async () => {
    mockSubmitRequest.mockResolvedValue({ projects: [], total: 0 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountProjects({ page: 1, pageSize: 5 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects",
      params: { page: 1, page_size: 5 },
    });
  });

  it("builds the query key", () => {
    expect(
      getAccountProjectsQueryOptions({ page: 1, pageSize: 5 }).queryKey,
    ).toEqual([QUERY_KEY.ACCOUNT_PROJECTS, undefined, 1, 5]);
  });
});

describe("account packages by account id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the account packages", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetAccountPackagesByAccountId({
          accountId: 9,
          searchOptions: { s: "1" },
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/accounts/9/packages",
      params: { s: "1" },
    });
  });

  it("is disabled without an account id and supports overrides", () => {
    expect(
      getAccountPackagesByAccountIdQueryOptions({ accountId: undefined })
        .enabled,
    ).toBe(false);
    expect(
      getAccountPackagesByAccountIdQueryOptions({
        accountId: 1,
        customQueryOptions: { staleTime: 99 },
      }).staleTime,
    ).toBe(99);
  });
});

describe("account projects by user id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the user's projects", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetAccountProjectsByUserId({ userId: 11 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/projects/users/11",
    });
  });

  it("is disabled for a falsy user id", () => {
    expect(getAccountProjectsByUserQueryOptions({ userId: 0 }).enabled).toBe(
      false,
    );
  });
});
