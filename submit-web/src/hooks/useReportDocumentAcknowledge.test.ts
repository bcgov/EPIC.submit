import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("./api/useSubmissions", () => ({
  useAcknowledgeReportDocument: vi.fn(),
}));

import { useAcknowledgeReportDocument } from "./api/useSubmissions";
import { useReportDocumentAcknowledge } from "./useReportDocumentAcknowledge";

const mockUseAck = vi.mocked(useAcknowledgeReportDocument);

describe("useReportDocumentAcknowledge", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAck.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAcknowledgeReportDocument>);
  });

  it("passes the package id to the mutation hook", () => {
    renderHook(() => useReportDocumentAcknowledge({ packageId: 4 }));
    expect(mockUseAck).toHaveBeenCalledWith({ packageId: 4 });
  });

  it("acknowledges a submission by id", async () => {
    mutateAsync.mockResolvedValue({ id: 8 });
    const { result } = renderHook(() =>
      useReportDocumentAcknowledge({ packageId: 4 }),
    );

    await result.current.acknowledge(8);

    expect(mutateAsync).toHaveBeenCalledWith({ submissionId: 8 });
  });

  it("rejects when the mutation fails", async () => {
    mutateAsync.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() =>
      useReportDocumentAcknowledge({ packageId: 4 }),
    );

    await expect(result.current.acknowledge(8)).rejects.toThrow("nope");
  });

  it("exposes the pending state as isAcknowledging", () => {
    mockUseAck.mockReturnValue({
      mutateAsync,
      isPending: true,
    } as unknown as ReturnType<typeof useAcknowledgeReportDocument>);
    const { result } = renderHook(() => useReportDocumentAcknowledge({}));
    expect(result.current.isAcknowledging).toBe(true);
  });
});
