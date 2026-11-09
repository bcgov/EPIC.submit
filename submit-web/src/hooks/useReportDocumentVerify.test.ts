import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("./api/useSubmissions", () => ({
  useUpdateSubmissionStatus: vi.fn(),
}));

import { useUpdateSubmissionStatus } from "./api/useSubmissions";
import { useReportDocumentVerify } from "./useReportDocumentVerify";

const mockUseUpdate = vi.mocked(useUpdateSubmissionStatus);

describe("useReportDocumentVerify", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdate.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSubmissionStatus>);
  });

  it("passes the package id to the mutation hook", () => {
    renderHook(() => useReportDocumentVerify({ packageId: 9 }));
    expect(mockUseUpdate).toHaveBeenCalledWith({ packageId: 9 });
  });

  it("verifies a submission by setting its status to VERIFIED", async () => {
    mutateAsync.mockResolvedValue({ id: 3 });
    const { result } = renderHook(() => useReportDocumentVerify({ packageId: 9 }));

    await result.current.verify(3);

    expect(mutateAsync).toHaveBeenCalledWith({
      submissionId: 3,
      status: "VERIFIED",
    });
  });

  it("rejects when the mutation fails", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useReportDocumentVerify({ packageId: 9 }));

    await expect(result.current.verify(3)).rejects.toThrow("boom");
  });

  it("exposes the pending state as isVerifying", () => {
    mockUseUpdate.mockReturnValue({
      mutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateSubmissionStatus>);
    const { result } = renderHook(() => useReportDocumentVerify({}));
    expect(result.current.isVerifying).toBe(true);
  });
});
