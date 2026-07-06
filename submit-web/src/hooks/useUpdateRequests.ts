import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  PendingRequest,
  PreviousRequest,
  SentRequest,
} from "@/components/App/SubmissionItem/SectionUpdateRequestPanel/types";
import {
  useAcceptUpdateRequest,
  useCreatePackageUpdateRequest,
  useWithdrawUpdateRequest,
} from "./api/usePackages";
import { UPDATE_REQUEST_STATUS } from "@/models/UpdateRequest";
import { SubmissionPackage } from "@/models/Package";

interface UseUpdateRequestsOptions {
  submissionPackageId: number;
  submissionPackage?: SubmissionPackage;
  accountProjectId: number;
  queryClient: ReturnType<typeof useQueryClient>;
}

export function useUpdateRequests({
  submissionPackageId,
  submissionPackage,
  accountProjectId,
  queryClient,
}: UseUpdateRequestsOptions) {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isSendingRequests, setIsSendingRequests] = useState(false);

  // ─── Derived State ────────────────────────────────────────────────────────

  const previousUpdateRequests = useMemo<PreviousRequest[]>(() => {
    if (!submissionPackage?.all_update_requests) return [];

    return submissionPackage.all_update_requests
      .filter(
        (req) =>
          !req.active &&
          (req.status === UPDATE_REQUEST_STATUS.ACCEPTED.value ||
            req.status === UPDATE_REQUEST_STATUS.CLOSED.value),
      )
      .map((req) => {
        // Get the first item type name for display
        const firstItemTypeId = req.submission_item_types[0];
        const item = firstItemTypeId
          ? submissionPackage.items.find((i) => i.type_id === firstItemTypeId)
          : undefined;
        return {
          updateRequestId: req.id,
          itemTypeId: firstItemTypeId || 0,
          itemTypeName: item?.type.name || "Update Request",
          reason: req.reason || "",
          createdBy: req.created_by || "",
          createdDate: req.created_date || "",
          status: req.status || "",
          note: req.note || undefined,
          noteUpdatedBy: req.note_updated_by || undefined,
          noteUpdatedAt: req.note_updated_at || undefined,
        };
      });
  }, [submissionPackage]);

  const sentUpdateRequests = useMemo<SentRequest[]>(() => {
    if (!submissionPackage?.update_requests) return [];

    return submissionPackage.update_requests
      .filter(
        (req) =>
          req.status !== UPDATE_REQUEST_STATUS.ACCEPTED.value && req.active,
      )
      .flatMap((req) =>
        req.submission_item_types.map((itemTypeId) => {
          const item = submissionPackage.items.find(
            (i) => i.type_id === itemTypeId,
          );
          return {
            updateRequestId: req.id,
            itemTypeId,
            itemTypeName: item?.type.name || "",
            reason: req.reason || "",
            createdBy: req.created_by || "",
            createdDate: req.created_date || "",
            status: req.status || "",
            note: req.note || undefined,
            noteUpdatedBy: req.note_updated_by || undefined,
            noteUpdatedAt: req.note_updated_at || undefined,
          };
        }),
      );
  }, [submissionPackage]);

  const openRequestSectionNames = useMemo(
    () =>
      Array.from(new Set(sentUpdateRequests.map((req) => req.itemTypeName))),
    [sentUpdateRequests],
  );

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createUpdateRequestMutation = useCreatePackageUpdateRequest({
    packageId: submissionPackageId,
    accountProjectId,
  });

  const acceptUpdateRequestMutation = useAcceptUpdateRequest({
    packageId: submissionPackageId,
    options: {
      onSuccess: () => {
        notify.success("Update request accepted successfully");
        queryClient.invalidateQueries({
          queryKey: ["packages", submissionPackageId],
        });
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to accept update request",
        );
      },
    },
  });

  const withdrawUpdateRequestMutation = useWithdrawUpdateRequest({
    packageId: submissionPackageId,
    options: {
      onSuccess: () => {
        notify.success("Update request withdrawn successfully");
        queryClient.invalidateQueries({
          queryKey: ["packages", submissionPackageId],
        });
      },
      onError: (error: any) => {
        notify.error(
          error?.response?.data?.message ?? "Failed to withdraw update request",
        );
      },
    },
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleRequestUpdate = useCallback(
    (itemTypeId: number, itemTypeName: string) => {
      const alreadyPending = pendingRequests.some(
        (req) => req.itemTypeId === itemTypeId,
      );
      const alreadySent = sentUpdateRequests.some(
        (req) => req.itemTypeId === itemTypeId,
      );

      if (alreadyPending) {
        notify.warning("Update request already pending for this section");
        return;
      }
      if (alreadySent) {
        notify.warning("Update request already exists for this section");
        return;
      }

      setPendingRequests((prev) => [
        ...prev,
        { itemTypeId, itemTypeName, reason: "" },
      ]);
    },
    [pendingRequests, sentUpdateRequests],
  );

  const handleRemoveRequest = useCallback((itemTypeId: number) => {
    setPendingRequests((prev) =>
      prev.filter((req) => req.itemTypeId !== itemTypeId),
    );
  }, []);

  const handleUpdateNote = useCallback((itemTypeId: number, reason: string) => {
    setPendingRequests((prev) =>
      prev.map((req) =>
        req.itemTypeId === itemTypeId ? { ...req, reason } : req,
      ),
    );
  }, []);

  const handleSendRequests = useCallback(async () => {
    if (pendingRequests.length === 0) return;
    setIsSendingRequests(true);

    // Snapshot and clear immediately so any re-invocation (e.g. double-click)
    // sees an empty list and exits early before the first await resolves.
    const toSend = [...pendingRequests];
    setPendingRequests([]);

    try {
      for (const request of toSend) {
        await createUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          data: {
            submission_item_types: [request.itemTypeId],
            reason: request.reason,
          },
        });
      }

      notify.success("Update request(s) sent successfully");
      queryClient.invalidateQueries({
        queryKey: ["packages", submissionPackageId],
      });
    } catch {
      // Restore the requests that didn't make it so the user can retry.
      setPendingRequests(toSend);
      notify.error("Failed to send update request(s)");
    } finally {
      setIsSendingRequests(false);
    }
  }, [
    pendingRequests,
    submissionPackageId,
    createUpdateRequestMutation,
    queryClient,
  ]);

  const handleAcceptUpdate = useCallback(
    async (updateRequestId: number) => {
      try {
        await acceptUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          updateRequestId,
        });
      } catch (error) {
        // Error handling is done in the mutation's onError callback
      }
    },
    [submissionPackageId, acceptUpdateRequestMutation],
  );

  const handleWithdrawUpdate = useCallback(
    async (updateRequestId: number) => {
      try {
        await withdrawUpdateRequestMutation.mutateAsync({
          packageId: submissionPackageId,
          updateRequestId,
        });
      } catch (error) {
        // Error handling is done in the mutation's onError callback
      }
    },
    [submissionPackageId, withdrawUpdateRequestMutation],
  );

  return {
    pendingRequests,
    previousUpdateRequests,
    sentUpdateRequests,
    openRequestSectionNames,
    handleRequestUpdate,
    handleRemoveRequest,
    handleUpdateNote,
    handleSendRequests,
    handleAcceptUpdate,
    handleWithdrawUpdate,
    isSendingRequests,
  };
}
