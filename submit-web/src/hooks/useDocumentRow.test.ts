import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/components/Shared/Table/utils", () => ({
  getObjectFromS3: vi.fn(),
}));

vi.mock("./api/useSubmissions", () => ({
  useUpdateSubmissionStatus: vi.fn(),
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    isAxiosError: (e: { isAxiosError?: boolean } | null) =>
      e?.isAxiosError === true,
  };
});

import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { useUpdateSubmissionStatus } from "./api/useSubmissions";
import { useDocumentRow } from "./useDocumentRow";
import {
  PackageType,
  SubmissionPackage,
  SubmissionPackageType,
} from "@/models/Package";
import { Submission } from "@/models/Submission";

const mockNotify = vi.mocked(notify);
const mockGetObject = vi.mocked(getObjectFromS3);
const mockUseUpdate = vi.mocked(useUpdateSubmissionStatus);

const buildSubmission = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 5,
    status: "SUBMITTED",
    minor_version: 1,
    is_updated: false,
    submitted_document: {
      name: "doc.pdf",
      url: "s3://doc.pdf",
      is_virus_rejected: false,
    },
    ...overrides,
  }) as unknown as Submission;

const buildPackage = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 77,
    status: ["SUBMITTED"],
    completed_on: undefined,
    account_project_work: undefined,
    ...overrides,
  }) as unknown as SubmissionPackage;

describe("useDocumentRow", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({});
    mockUseUpdate.mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useUpdateSubmissionStatus>);
  });

  describe("derived state", () => {
    it("passes the package id to the status mutation", () => {
      renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage(),
        }),
      );
      expect(mockUseUpdate).toHaveBeenCalledWith({ packageId: 77 });
    });

    it("reports ready for acknowledgement when status includes READY_FOR_ACKNOWLEDGEMENT", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage({
            status: ["READY_FOR_ACKNOWLEDGEMENT"],
          }),
        }),
      );
      expect(result.current.isPackageReadyForAcknowledgement).toBe(true);
    });

    it("reports not ready for acknowledgement without a package", () => {
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      expect(result.current.isPackageReadyForAcknowledgement).toBe(false);
    });

    it("detects Additional Information package types", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          packageType: {
            name: SubmissionPackageType.ADDITIONAL_INFORMATION,
          } as PackageType,
        }),
      );
      expect(result.current.isAdditionalInfo).toBe(true);
    });

    it("is not additional info for other types", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          packageType: { name: SubmissionPackageType.IEM } as PackageType,
        }),
      );
      expect(result.current.isAdditionalInfo).toBe(false);
    });

    it("shows undo verification for verified documents in unacknowledged packages", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission({ status: "VERIFIED" }),
          submissionPackage: buildPackage(),
        }),
      );
      expect(result.current.showUndoVerificationButton).toBe(true);
    });

    it("hides undo verification once the package is acknowledged", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission({ status: "VERIFIED" }),
          submissionPackage: buildPackage({ status: ["ACKNOWLEDGED"] }),
        }),
      );
      expect(result.current.showUndoVerificationButton).toBe(false);
    });

    it("hides undo verification for documents that are not verified", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage(),
        }),
      );
      expect(result.current.showUndoVerificationButton).toBe(false);
    });

    it("shows the default action button for open non-work packages", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage(),
        }),
      );
      expect(result.current.showDefaultActionButton).toBe(true);
    });

    it("hides the default action button for completed packages", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage({ completed_on: "2026-01-01" }),
        }),
      );
      expect(result.current.showDefaultActionButton).toBe(false);
    });

    it("hides the default action button for work packages", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission(),
          submissionPackage: buildPackage({ account_project_work: { id: 1 } }),
        }),
      );
      expect(result.current.showDefaultActionButton).toBe(false);
    });

    it("computes isNewVersion from the submission", () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission({
            minor_version: 2,
            is_updated: true,
          }),
        }),
      );
      expect(result.current.isNewVersion).toBe(true);
    });

    it("toggles expanded via setExpanded", () => {
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      expect(result.current.expanded).toBe(false);
      act(() => result.current.setExpanded(true));
      expect(result.current.expanded).toBe(true);
    });
  });

  describe("handleVerify", () => {
    it("updates the status to VERIFIED and notifies success", async () => {
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.handleVerify());
      expect(mutateAsync).toHaveBeenCalledWith({
        submissionId: 5,
        status: "VERIFIED",
      });
      expect(mockNotify.success).toHaveBeenCalledWith("Document verified");
    });

    it("notifies an error when verification fails", async () => {
      mutateAsync.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.handleVerify());
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to verify document",
      );
    });
  });

  describe("handleUndoVerification", () => {
    it("sets the status back to SUBMITTED and notifies success", async () => {
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.handleUndoVerification());
      expect(mutateAsync).toHaveBeenCalledWith({
        submissionId: 5,
        status: "SUBMITTED",
      });
      expect(mockNotify.success).toHaveBeenCalledWith("Verification undone");
    });

    it("notifies an error when undo fails", async () => {
      mutateAsync.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.handleUndoVerification());
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to undo verification",
      );
    });
  });

  describe("openDocument", () => {
    it("downloads the document from S3", async () => {
      mockGetObject.mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.openDocument());
      expect(mockGetObject).toHaveBeenCalledWith({
        name: "doc.pdf",
        url: "s3://doc.pdf",
      });
      expect(result.current.pendingGetObject).toBe(false);
    });

    it("sets pendingGetObject while the download is in flight", async () => {
      let resolve: () => void = () => {};
      mockGetObject.mockReturnValue(
        new Promise<void>((r) => {
          resolve = r;
        }) as unknown as ReturnType<typeof getObjectFromS3>,
      );
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      let pending: Promise<void> = Promise.resolve();
      act(() => {
        pending = result.current.openDocument();
      });
      await waitFor(() => expect(result.current.pendingGetObject).toBe(true));
      await act(async () => {
        resolve();
        await pending;
      });
      expect(result.current.pendingGetObject).toBe(false);
    });

    it("does not download virus rejected documents", async () => {
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission({
            submitted_document: { name: "a", url: "b", is_virus_rejected: true },
          }),
        }),
      );
      await act(() => result.current.openDocument());
      expect(mockGetObject).not.toHaveBeenCalled();
    });

    it("uses the axios error message when the download fails", async () => {
      mockGetObject.mockRejectedValue({
        isAxiosError: true,
        response: { data: { message: "Denied" } },
      });
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.openDocument());
      expect(mockNotify.error).toHaveBeenCalledWith("Denied");
    });

    it("uses a default message for axios errors without a message", async () => {
      mockGetObject.mockRejectedValue({ isAxiosError: true, response: {} });
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.openDocument());
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to download document",
      );
    });

    it("uses a default message for non-axios errors", async () => {
      mockGetObject.mockRejectedValue(new Error("x"));
      const { result } = renderHook(() =>
        useDocumentRow({ documentSubmission: buildSubmission() }),
      );
      await act(() => result.current.openDocument());
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to download document",
      );
    });

    it("falls back to empty name and url when there is no document", async () => {
      mockGetObject.mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useDocumentRow({
          documentSubmission: buildSubmission({ submitted_document: undefined }),
        }),
      );
      await act(() => result.current.openDocument());
      expect(mockGetObject).toHaveBeenCalledWith({ name: "", url: "" });
    });
  });
});
