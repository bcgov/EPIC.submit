import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  acknowledgeReportDocument,
  createSubmission,
  deleteSubmission,
  editSubmissionForm,
  getFailedSubmissionsByItemId,
  getSubmissionVersions,
  moveSubmission,
  replaceSubmission,
  softDeleteSubmission,
  triggerGeoProcess,
  updateSubmissionStatus,
  useAcknowledgeReportDocument,
  useCreateSubmission,
  useDeleteSubmission,
  useGetFailedSubmissionsByItemId,
  useGetSubmissionVersions,
  useGetSubmissionsByItemIdAndType,
  useMoveSubmission,
  useReplaceSubmussion,
  useSaveSubmission,
  useSoftDeleteSubmission,
  useTriggerGeoProcess,
  useUpdateSubmissionStatus,
} from "./useSubmissions";
import { QUERY_KEY } from "./constants";
import {
  SUBMISSION_TYPE,
  SubmissionStatus,
  SubmissionType,
} from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";

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

const makeItem = (
  submissions: { id: number; type: string }[],
): SubmissionItem =>
  ({ id: 50, submissions }) as unknown as SubmissionItem;

describe("request helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitRequest.mockResolvedValue({});
  });

  it("editSubmissionForm patches the form", async () => {
    await editSubmissionForm(1, { a: 1 });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/1/form",
      method: "patch",
      data: { a: 1 },
    });
  });

  it("createSubmission posts to the item", async () => {
    await createSubmission(2, { a: 1 });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/items/2",
      method: "post",
      data: { a: 1 },
    });
  });

  it("replaceSubmission posts to the document", async () => {
    await replaceSubmission({ submissionId: 3, data: { b: 2 } });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/3/document",
      method: "post",
      data: { b: 2 },
    });
  });

  it("deleteSubmission deletes the document", async () => {
    await deleteSubmission(4);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/4/document",
      method: "delete",
    });
  });

  it("softDeleteSubmission soft deletes the document", async () => {
    await softDeleteSubmission(4);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/4/document/soft-delete",
      method: "delete",
    });
  });

  it("getSubmissionVersions omits params without a package id", async () => {
    await getSubmissionVersions(5);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/5/versions",
      params: undefined,
    });
  });

  it("getSubmissionVersions passes the package id", async () => {
    await getSubmissionVersions(5, 9);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/5/versions",
      params: { package_id: 9 },
    });
  });

  it("getFailedSubmissionsByItemId requests failed documents", async () => {
    await getFailedSubmissionsByItemId(6);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/documents/failed/items/6",
    });
  });

  it("moveSubmission sends the destination payload", async () => {
    await moveSubmission({
      submissionId: 7,
      newPath: "/new",
      targetSubmissionId: 8,
      destinationItemId: 9,
      destinationFolder: "f",
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/7/document/move",
      method: "POST",
      data: {
        data: {
          destination_url: "/new",
          target_submission_id: 8,
          destination_item_id: 9,
          destination_folder: "f",
        },
        type: SUBMISSION_TYPE.DOCUMENT,
      },
    });
  });

  it("triggerGeoProcess posts to the geo-process endpoint", async () => {
    await triggerGeoProcess(10);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/items/10/geo-process",
      method: "post",
    });
  });

  it("updateSubmissionStatus patches the status", async () => {
    await updateSubmissionStatus(11, "Accepted" as SubmissionStatus);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/11/status",
      method: "PATCH",
      data: { status: "Accepted" },
    });
  });

  it("acknowledgeReportDocument posts the acknowledgement", async () => {
    await acknowledgeReportDocument(12);
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/12/acknowledge",
      method: "POST",
    });
  });
});

describe("useSaveSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edits the existing form submission and invalidates queries", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1, item_id: 50 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useSaveSubmission({
          accountProjectId: 3,
          submissionItem: makeItem([{ id: 77, type: SUBMISSION_TYPE.FORM }]),
          options: { onSuccess },
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ data: { x: 1 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/77/form",
      method: "patch",
      data: { x: 1 },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 50],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECT, 3],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCOUNT_PROJECTS],
    });
  });

  it("creates a submission when no form submission exists", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1, item_id: 50 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useSaveSubmission({
          accountProjectId: 3,
          submissionItem: makeItem([]),
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ data: { y: 2 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/items/50",
      method: "post",
      data: { y: 2 },
    });
  });

  it("errors when the submission item is missing", async () => {
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useSaveSubmission({ accountProjectId: 3, options: { onError } }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ data: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Submission item is required");
    expect(onError).toHaveBeenCalled();
    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useCreateSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a submission and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateSubmission(5, { onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ data: { z: 1 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/items/5",
      method: "post",
      data: { z: 1 },
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("succeeds without options", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateSubmission(5), { wrapper });

    await act(async () => {
      result.current.mutate({ data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("bad"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useCreateSubmission(5, { onError }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ data: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe("useGetSubmissionsByItemIdAndType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests document submissions for the item", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () =>
        useGetSubmissionsByItemIdAndType({
          itemId: 4,
          type: SUBMISSION_TYPE.DOCUMENT as SubmissionType,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "submissions/items/4",
      params: { type: SUBMISSION_TYPE.DOCUMENT },
    });
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetSubmissionsByItemIdAndType({
          itemId: 4,
          type: SUBMISSION_TYPE.DOCUMENT as SubmissionType,
          enabled: false,
        }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });

  it("does not fetch without an item id", () => {
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useGetSubmissionsByItemIdAndType({
          itemId: 0,
          type: SUBMISSION_TYPE.DOCUMENT as SubmissionType,
        }),
      { wrapper },
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useReplaceSubmussion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("replaces the document and invalidates the package", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useReplaceSubmussion({ submissionPackageId: 8, onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ submissionId: 2, data: { f: 1 } });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/2/document",
      method: "post",
      data: { f: 1 },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 8],
    });
  });

  it("invalidates the package without an onSuccess callback", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(
      () => useReplaceSubmussion({ submissionPackageId: 8 }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ submissionId: 2, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("bad"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useReplaceSubmussion({ submissionPackageId: 8, onError }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ submissionId: 2, data: {} });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe.each([
  ["useDeleteSubmission", useDeleteSubmission, "/submissions/6/document"],
  [
    "useSoftDeleteSubmission",
    useSoftDeleteSubmission,
    "/submissions/6/document/soft-delete",
  ],
])("%s", (_name, useHook, expectedUrl) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes and invalidates the submission item", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 6 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useHook({ submissionItemId: 33, onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(6);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: expectedUrl,
      method: "delete",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_ITEM, 33],
    });
  });

  it("invalidates without an onSuccess callback", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 6 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useHook({ submissionItemId: 33 }), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(6);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("bad"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(
      () => useHook({ submissionItemId: 33, onError }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(6);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe("useGetSubmissionVersions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests versions with the package id", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetSubmissionVersions(5, 9), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/5/versions",
      params: { package_id: 9 },
    });
  });
});

describe("useGetFailedSubmissionsByItemId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests failed submissions for the item", async () => {
    mockSubmitRequest.mockResolvedValue([]);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGetFailedSubmissionsByItemId(6), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/documents/failed/items/6",
    });
  });

  it("does not fetch without an item id", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGetFailedSubmissionsByItemId(0), { wrapper });

    expect(mockSubmitRequest).not.toHaveBeenCalled();
  });
});

describe("useMoveSubmission", () => {
  const params = {
    submissionId: 1,
    newPath: "/p",
    destinationItemId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves and invalidates the package when packageId is set", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useMoveSubmission({ packageId: 4, onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(params);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 4],
    });
  });

  it("does not invalidate without a packageId", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMoveSubmission({}), { wrapper });

    await act(async () => {
      result.current.mutate(params);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("calls onError on failure", async () => {
    mockSubmitRequest.mockRejectedValue(new Error("bad"));
    const { wrapper } = createWrapper();
    const onError = vi.fn();

    const { result } = renderHook(() => useMoveSubmission({ onError }), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(params);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe("useTriggerGeoProcess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers the geo process and calls onSuccess", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useTriggerGeoProcess({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ itemId: 3 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/items/3/geo-process",
      method: "post",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("succeeds without options", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useTriggerGeoProcess(), { wrapper });

    await act(async () => {
      result.current.mutate({ itemId: 3 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

describe("useAcknowledgeReportDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acknowledges and invalidates the package", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useAcknowledgeReportDocument({ packageId: 6, onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({ submissionId: 2 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/2/acknowledge",
      method: "POST",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 6],
    });
  });

  it("invalidates without an onSuccess callback", async () => {
    mockSubmitRequest.mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcknowledgeReportDocument({}), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ submissionId: 2 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useUpdateSubmissionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the status and invalidates the package", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useUpdateSubmissionStatus({ packageId: 6, onSuccess }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate({
        submissionId: 2,
        status: "Accepted" as SubmissionStatus,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockSubmitRequest).toHaveBeenCalledWith({
      url: "/submissions/2/status",
      method: "PATCH",
      data: { status: "Accepted" },
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SUBMISSION_PACKAGE, 6],
    });
  });

  it("invalidates without an onSuccess callback", async () => {
    mockSubmitRequest.mockResolvedValue({});
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateSubmissionStatus({}), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({
        submissionId: 2,
        status: "Accepted" as SubmissionStatus,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
