import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  getPackageVersionsByOriginalPackageIdQueryOptions,
  getStaffSubmissionPackageById,
  getStaffSubmissionPackageQueryOptions,
  getSubmissionPackageById,
  getSubmissionPackageQueryOptions,
  useAcceptUpdateRequest,
  useCreateNewPackageVersion,
  useCreatePackageUpdateRequesNote,
  useCreatePackageUpdateRequest,
  useCreateSubmissionPackage,
  useGetPackageVersionsByOriginalPackageId,
  useGetStaffSubmissionPackage,
  useGetSubmissionPackage,
  useRefuseSubmissionPackage,
  useUpdatePackageUpdateRequestNote,
  useUpdateStateSubmissionPackage,
  useWithdrawPackage,
  useWithdrawUpdateRequest,
} from "./usePackages";
import { QUERY_KEY } from "./constants";
import { ACTIVITY_LOG_ENTITY_TYPE } from "@/models/ActivityLog";

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

const pkg = {
  id: 10,
  account_project_id: 20,
  version: { original_package_id: 30 },
};
const pkgNoVersion = { id: 10, account_project_id: 20, version: undefined };

describe("package fetchers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSubmissionPackageById requests the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);

    await getSubmissionPackageById({ packageId: 10 });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "packages/10" });
  });

  it("getStaffSubmissionPackageById requests the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);

    await getStaffSubmissionPackageById({ packageId: 11 });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "packages/11" });
  });
});

describe("useGetSubmissionPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetSubmissionPackage({ packageId: 10 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "packages/10" });
  });

  it("does not fetch when packageId is falsy", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetSubmissionPackage({ packageId: 0 }), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetSubmissionPackage({ packageId: 1, enabled: false }), {
      wrapper,
    });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options with zero staleTime", () => {
    const options = getSubmissionPackageQueryOptions({ packageId: 3 });

    expect(options.queryKey).toEqual([QUERY_KEY.SUBMISSION_PACKAGE, 3]);
    expect(options.staleTime).toBe(0);
    expect(options.enabled).toBe(true);
  });
});

describe("useGetStaffSubmissionPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetStaffSubmissionPackage({ packageId: 12 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({ url: "packages/12" });
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () => useGetStaffSubmissionPackage({ packageId: 12, enabled: false }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options with zero staleTime", () => {
    const options = getStaffSubmissionPackageQueryOptions({ packageId: 0 });

    expect(options.queryKey).toEqual([QUERY_KEY.SUBMISSION_PACKAGE, 0]);
    expect(options.staleTime).toBe(0);
    expect(options.enabled).toBe(false);
  });
});

describe("useGetPackageVersionsByOriginalPackageId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flags only the highest version as latest", async () => {
    mockSubmitRequest.mockResolvedValue([
      { id: 1, version: 1 },
      { id: 2, version: 3 },
      { id: 3, version: 2 },
    ]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetPackageVersionsByOriginalPackageId({ originalPackageId: 4 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "packages/4/versions",
    });
    expect(result.current.data?.map((v) => v.is_latest)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it("returns an empty list unchanged", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useGetPackageVersionsByOriginalPackageId({ originalPackageId: 4 }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it("does not fetch without an original package id", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetPackageVersionsByOriginalPackageId({
          originalPackageId: undefined,
        }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("builds query options keyed by original package id", () => {
    const options = getPackageVersionsByOriginalPackageIdQueryOptions({
      originalPackageId: 9,
      enabled: false,
    });

    expect(options.queryKey).toEqual([QUERY_KEY.PACKAGE_VERSIONS, 9]);
    expect(options.enabled).toBe(false);
  });
});

describe("useCreateSubmissionPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts, caches the package and invalidates account project queries", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateSubmissionPackage({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ accountProjectId: 20, data: { a: 1 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/account-projects/20",
      method: "post",
      data: { a: 1 },
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(
      queryClient.getQueryData([QUERY_KEY.SUBMISSION_PACKAGE, 10]),
    ).toEqual(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("works without options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateSubmissionPackage(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ accountProjectId: 20, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("calls onError when the request fails", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useCreateSubmissionPackage({ onError }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ accountProjectId: 20, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalled();
  });
});

describe("useCreateNewPackageVersion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const versionData = { version: 2 } as unknown as Parameters<
    ReturnType<typeof useCreateNewPackageVersion>["mutate"]
  >[0]["data"];

  it("invalidates version and activity log queries when package has a version", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateNewPackageVersion({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ originalPackageId: 30, data: versionData });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/30/versions",
      method: "post",
      data: versionData,
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.PACKAGE_VERSIONS, 30],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [
        QUERY_KEY.ACTIVITY_LOGS,
        30,
        ACTIVITY_LOG_ENTITY_TYPE.PACKAGE,
      ],
    });
  });

  it("skips version queries when the package has no version", async () => {
    mockSubmitRequest.mockResolvedValue(pkgNoVersion);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateNewPackageVersion(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ originalPackageId: 30, data: versionData });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const keys = invalidateSpy.mock.calls.map(
      (c) => (c[0]?.queryKey as unknown[])[0],
    );
    expect(keys).not.toContain(QUERY_KEY.PACKAGE_VERSIONS);
    expect(keys).not.toContain(QUERY_KEY.ACTIVITY_LOGS);
  });
});

describe("useUpdateStateSubmissionPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts state, refreshes queries and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useUpdateStateSubmissionPackage({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, data: { state: "x" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/state",
      method: "post",
      data: { state: "x" },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 10],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVITY_LOGS],
    });
  });

  it("works without options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateStateSubmissionPackage(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ packageId: 10, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useRefuseSubmissionPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts refusal, calls onSuccess and refreshes queries", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useRefuseSubmissionPackage({ onSuccess }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, data: { reason: "r" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/refuse",
      method: "post",
      data: { reason: "r" },
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 10],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVITY_LOGS],
    });
  });

  it("works without options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRefuseSubmissionPackage(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ packageId: 10, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useWithdrawPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts withdraw, calls onSuccess and refreshes queries", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useWithdrawPackage({ onSuccess }), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ packageId: 10 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/withdraw",
      method: "post",
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 10],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_VERSIONS, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.PACKAGE_VERSIONS, 30],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
    expect(refetchSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACTIVITY_LOGS],
    });
  });

  it("works without options", async () => {
    mockSubmitRequest.mockResolvedValue(pkgNoVersion);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useWithdrawPackage(), { wrapper });

    act(() => {
      result.current.mutate({ packageId: 10 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("update request mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useCreatePackageUpdateRequest posts, caches and invalidates", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useCreatePackageUpdateRequest({
          packageId: 10,
          accountProjectId: 20,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, data: { note: "n" } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/update-request",
      method: "post",
      data: { note: "n" },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      queryClient.getQueryData([QUERY_KEY.SUBMISSION_PACKAGE, 10]),
    ).toEqual(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("useCreatePackageUpdateRequest works with default options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useCreatePackageUpdateRequest({ packageId: 10, accountProjectId: 20 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useAcceptUpdateRequest patches, caches and invalidates", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useAcceptUpdateRequest({
          packageId: 10,
          accountProjectId: 20,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/update-request/5",
      method: "patch",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      queryClient.getQueryData([QUERY_KEY.SUBMISSION_PACKAGE, 10]),
    ).toEqual(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("useAcceptUpdateRequest works with default options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useAcceptUpdateRequest({ packageId: 10, accountProjectId: 20 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useWithdrawUpdateRequest deletes, caches and invalidates", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useWithdrawUpdateRequest({
          packageId: 10,
          accountProjectId: 20,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/update-request/5",
      method: "delete",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(
      queryClient.getQueryData([QUERY_KEY.SUBMISSION_PACKAGE, 10]),
    ).toEqual(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 20],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("useWithdrawUpdateRequest works with default options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useWithdrawUpdateRequest({ packageId: 10, accountProjectId: 20 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("update request note mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useCreatePackageUpdateRequesNote posts the note and refreshes the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useCreatePackageUpdateRequesNote({
          packageId: 10,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        packageId: 10,
        updateRequestId: 5,
        data: { note: "n" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/update-requests/5/note",
      method: "post",
      data: { note: "n" },
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(
      queryClient.getQueryData([QUERY_KEY.SUBMISSION_PACKAGE, 10]),
    ).toEqual(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 10],
    });
  });

  it("useCreatePackageUpdateRequesNote works with default options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useCreatePackageUpdateRequesNote({ packageId: 10 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useUpdatePackageUpdateRequestNote patches the note and refreshes the package", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useUpdatePackageUpdateRequestNote({
          packageId: 10,
          options: { onSuccess },
        }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        packageId: 10,
        updateRequestId: 5,
        data: { note: "edited" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/packages/10/update-requests/5/note",
      method: "patch",
      data: { note: "edited" },
    });
    expect(onSuccess).toHaveBeenCalledWith(pkg);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 10],
    });
  });

  it("useUpdatePackageUpdateRequestNote works with default options", async () => {
    mockSubmitRequest.mockResolvedValue(pkg);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useUpdatePackageUpdateRequestNote({ packageId: 10 }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ packageId: 10, updateRequestId: 5, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
