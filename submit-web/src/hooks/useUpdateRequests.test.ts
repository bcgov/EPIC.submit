import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@/components/Shared/Snackbar/snackbarStore", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("./api/usePackages", () => ({
  useCreatePackageUpdateRequest: vi.fn(),
  useAcceptUpdateRequest: vi.fn(),
  useWithdrawUpdateRequest: vi.fn(),
}));

import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  useAcceptUpdateRequest,
  useCreatePackageUpdateRequest,
  useWithdrawUpdateRequest,
} from "./api/usePackages";
import { useUpdateRequests } from "./useUpdateRequests";
import { SubmissionPackage } from "@/models/Package";

const mockNotify = vi.mocked(notify);
const mockCreate = vi.mocked(useCreatePackageUpdateRequest);
const mockAccept = vi.mocked(useAcceptUpdateRequest);
const mockWithdraw = vi.mocked(useWithdrawUpdateRequest);

type MutationOptions = {
  options?: {
    onSuccess?: () => void;
    onError?: (e: unknown) => void;
  };
};

const createMutateAsync = vi.fn();
const acceptMutateAsync = vi.fn();
const withdrawMutateAsync = vi.fn();

const queryClient = new QueryClient();
const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

const buildPackage = () =>
  ({
    items: [
      { type_id: 1, type: { name: "Section A" } },
      { type_id: 2, type: { name: "Section B" } },
    ],
    all_update_requests: [
      {
        id: 10,
        active: false,
        status: "ACCEPTED",
        submission_item_types: [1],
        reason: "r1",
        created_by: "staff",
        created_date: "2026-01-01",
        note: "n",
        note_updated_by: "u",
        note_updated_at: "2026-01-02",
      },
      {
        id: 11,
        active: false,
        status: "CLOSED",
        submission_item_types: [],
      },
      {
        id: 12,
        active: false,
        status: "CLOSED",
        submission_item_types: [99],
      },
      {
        id: 13,
        active: true,
        status: "ACCEPTED",
        submission_item_types: [1],
      },
      {
        id: 14,
        active: false,
        status: "OPEN",
        submission_item_types: [1],
      },
    ],
    update_requests: [
      {
        id: 20,
        active: true,
        status: "OPEN",
        submission_item_types: [1, 2],
        reason: "need",
        created_by: "staff",
        created_date: "2026-02-01",
        note: "sent note",
        note_updated_by: "u2",
        note_updated_at: "2026-02-02",
      },
      {
        id: 21,
        active: true,
        status: "ACCEPTED",
        submission_item_types: [1],
      },
      {
        id: 22,
        active: false,
        status: "OPEN",
        submission_item_types: [1],
      },
      {
        id: 23,
        active: true,
        status: "OPEN",
        submission_item_types: [55],
      },
    ],
  }) as unknown as SubmissionPackage;

const setup = (submissionPackage?: SubmissionPackage) =>
  renderHook(() =>
    useUpdateRequests({
      submissionPackageId: 3,
      submissionPackage,
      accountProjectId: 8,
      queryClient,
    }),
  );

describe("useUpdateRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue({});
    acceptMutateAsync.mockResolvedValue({});
    withdrawMutateAsync.mockResolvedValue({});
    mockCreate.mockReturnValue({
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreatePackageUpdateRequest>);
    mockAccept.mockReturnValue({
      mutateAsync: acceptMutateAsync,
    } as unknown as ReturnType<typeof useAcceptUpdateRequest>);
    mockWithdraw.mockReturnValue({
      mutateAsync: withdrawMutateAsync,
    } as unknown as ReturnType<typeof useWithdrawUpdateRequest>);
  });

  describe("derived state", () => {
    it("returns empty lists when there is no package", () => {
      const { result } = setup(undefined);
      expect(result.current.previousUpdateRequests).toEqual([]);
      expect(result.current.sentUpdateRequests).toEqual([]);
      expect(result.current.openRequestSectionNames).toEqual([]);
    });

    it("includes only inactive accepted or closed requests as previous", () => {
      const { result } = setup(buildPackage());
      expect(
        result.current.previousUpdateRequests.map((r) => r.updateRequestId),
      ).toEqual([10, 11, 12]);
    });

    it("maps previous request fields and the first item type name", () => {
      const { result } = setup(buildPackage());
      expect(result.current.previousUpdateRequests[0]).toEqual({
        updateRequestId: 10,
        itemTypeId: 1,
        itemTypeName: "Section A",
        reason: "r1",
        createdBy: "staff",
        createdDate: "2026-01-01",
        status: "ACCEPTED",
        note: "n",
        noteUpdatedBy: "u",
        noteUpdatedAt: "2026-01-02",
      });
    });

    it("uses defaults for previous requests with missing data", () => {
      const { result } = setup(buildPackage());
      const [, noTypes, unknownType] = result.current.previousUpdateRequests;
      expect(noTypes).toMatchObject({
        itemTypeId: 0,
        itemTypeName: "Update Request",
        reason: "",
        createdBy: "",
        createdDate: "",
        note: undefined,
      });
      expect(unknownType.itemTypeName).toBe("Update Request");
    });

    it("returns active non-accepted requests as sent, one per item type", () => {
      const { result } = setup(buildPackage());
      expect(
        result.current.sentUpdateRequests.map((r) => [
          r.updateRequestId,
          r.itemTypeId,
        ]),
      ).toEqual([
        [20, 1],
        [20, 2],
        [23, 55],
      ]);
    });

    it("maps sent request fields and defaults the name when the item is missing", () => {
      const { result } = setup(buildPackage());
      expect(result.current.sentUpdateRequests[0]).toMatchObject({
        itemTypeName: "Section A",
        reason: "need",
        note: "sent note",
        noteUpdatedBy: "u2",
      });
      expect(result.current.sentUpdateRequests[2]).toMatchObject({
        itemTypeName: "",
        reason: "",
        createdBy: "",
        status: "OPEN",
      });
    });

    it("lists unique open request section names", () => {
      const { result } = setup(buildPackage());
      expect(result.current.openRequestSectionNames).toEqual([
        "Section A",
        "Section B",
        "",
      ]);
    });
  });

  describe("pending requests", () => {
    it("adds a pending request", () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "New Section"));
      expect(result.current.pendingRequests).toEqual([
        { itemTypeId: 2000, itemTypeName: "New Section", reason: "" },
      ]);
    });

    it("warns when the request is already pending", () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "New Section"));
      act(() => result.current.handleRequestUpdate(2000, "New Section"));
      expect(mockNotify.warning).toHaveBeenCalledWith(
        "Update request already pending for this section",
      );
      expect(result.current.pendingRequests).toHaveLength(1);
    });

    it("warns when the request was already sent", () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(1, "Section A"));
      expect(mockNotify.warning).toHaveBeenCalledWith(
        "Update request already exists for this section",
      );
      expect(result.current.pendingRequests).toEqual([]);
    });

    it("removes a pending request", () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "X"));
      act(() => result.current.handleRequestUpdate(3000, "Y"));
      act(() => result.current.handleRemoveRequest(2000));
      expect(result.current.pendingRequests.map((r) => r.itemTypeId)).toEqual([
        3000,
      ]);
    });

    it("updates the reason of the matching pending request only", () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "X"));
      act(() => result.current.handleRequestUpdate(3000, "Y"));
      act(() => result.current.handleUpdateNote(2000, "because"));
      expect(result.current.pendingRequests.map((r) => r.reason)).toEqual([
        "because",
        "",
      ]);
    });
  });

  describe("handleSendRequests", () => {
    it("does nothing when there are no pending requests", async () => {
      const { result } = setup(buildPackage());
      await act(() => result.current.handleSendRequests());
      expect(createMutateAsync).not.toHaveBeenCalled();
      expect(result.current.isSendingRequests).toBe(false);
    });

    it("sends each pending request, clears them and invalidates the package", async () => {
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "X"));
      act(() => result.current.handleUpdateNote(2000, "why"));
      act(() => result.current.handleRequestUpdate(3000, "Y"));

      await act(() => result.current.handleSendRequests());

      expect(createMutateAsync).toHaveBeenCalledTimes(2);
      expect(createMutateAsync).toHaveBeenNthCalledWith(1, {
        packageId: 3,
        data: { submission_item_types: [2000], reason: "why" },
      });
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Update request(s) sent successfully",
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["packages", 3] });
      expect(result.current.pendingRequests).toEqual([]);
      expect(result.current.isSendingRequests).toBe(false);
    });

    it("restores pending requests and notifies an error on failure", async () => {
      createMutateAsync.mockRejectedValue(new Error("fail"));
      const { result } = setup(buildPackage());
      act(() => result.current.handleRequestUpdate(2000, "X"));

      await act(() => result.current.handleSendRequests());

      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to send update request(s)",
      );
      expect(result.current.pendingRequests).toHaveLength(1);
      expect(result.current.isSendingRequests).toBe(false);
    });
  });

  describe("accept and withdraw", () => {
    it("accepts an update request", async () => {
      const { result } = setup(buildPackage());
      await act(() => result.current.handleAcceptUpdate(20));
      expect(acceptMutateAsync).toHaveBeenCalledWith({
        packageId: 3,
        updateRequestId: 20,
      });
    });

    it("swallows accept errors", async () => {
      acceptMutateAsync.mockRejectedValue(new Error("x"));
      const { result } = setup(buildPackage());
      await expect(
        act(() => result.current.handleAcceptUpdate(20)),
      ).resolves.not.toThrow();
    });

    it("withdraws an update request", async () => {
      const { result } = setup(buildPackage());
      await act(() => result.current.handleWithdrawUpdate(20));
      expect(withdrawMutateAsync).toHaveBeenCalledWith({
        packageId: 3,
        updateRequestId: 20,
      });
    });

    it("swallows withdraw errors", async () => {
      withdrawMutateAsync.mockRejectedValue(new Error("x"));
      const { result } = setup(buildPackage());
      await expect(
        act(() => result.current.handleWithdrawUpdate(20)),
      ).resolves.not.toThrow();
    });
  });

  describe("mutation callbacks", () => {
    const getOptions = (m: typeof mockAccept | typeof mockWithdraw) =>
      (m.mock.calls[0][0] as unknown as MutationOptions).options!;

    it("notifies and invalidates when accept succeeds", () => {
      setup(buildPackage());
      getOptions(mockAccept).onSuccess!();
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Update request accepted successfully",
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["packages", 3] });
    });

    it("notifies the server message when accept fails", () => {
      setup(buildPackage());
      getOptions(mockAccept).onError!({
        response: { data: { message: "Nope" } },
      });
      expect(mockNotify.error).toHaveBeenCalledWith("Nope");
    });

    it("notifies a default message when accept fails without a message", () => {
      setup(buildPackage());
      getOptions(mockAccept).onError!(undefined);
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to accept update request",
      );
    });

    it("notifies and invalidates when withdraw succeeds", () => {
      setup(buildPackage());
      getOptions(mockWithdraw).onSuccess!();
      expect(mockNotify.success).toHaveBeenCalledWith(
        "Update request withdrawn successfully",
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["packages", 3] });
    });

    it("notifies the server message when withdraw fails", () => {
      setup(buildPackage());
      getOptions(mockWithdraw).onError!({
        response: { data: { message: "Bad" } },
      });
      expect(mockNotify.error).toHaveBeenCalledWith("Bad");
    });

    it("notifies a default message when withdraw fails without a message", () => {
      setup(buildPackage());
      getOptions(mockWithdraw).onError!({});
      expect(mockNotify.error).toHaveBeenCalledWith(
        "Failed to withdraw update request",
      );
    });
  });
});
