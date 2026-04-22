import { useState, useMemo, useCallback } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { BCDesignTokens } from "epic.theme";
import { Grid } from "@mui/material";
import {
  GenericDocumentUploadSection,
  UploadSectionConfig,
} from "@/components/App/DocumentUpload/GenericDocumentUploadSection";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { SectionUpdateRequestPanel } from "@/components/App/SubmissionItem/SectionUpdateRequestPanel";
import { PendingRequest, SentRequest } from "@/components/App/SubmissionItem/SectionUpdateRequestPanel/types";
import { getSubmissionPackageQueryOptions, useCreatePackageUpdateRequest } from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export const EngagementPlanStaffView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const accountProjectId = Number(accountProjectIdParam);
  const submissionId = Number(submissionItemId);

  const { data: accountProject } = useGetAccountProjectForStaff({
    accountProjectId,
  });

  const { data: submissionItem } = useSuspenseQuery(
    getSubmissionItemForStaffQueryOptions({ itemId: submissionId }),
  );

  const queryClient = useQueryClient();
  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const { mutateAsync: createUpdateRequest, isPending: isCreatingRequest } =
    useCreatePackageUpdateRequest();

  const documentUploadSections: UploadSectionConfig[] = useMemo(
    () => [
      {
        name: "engagementPlan",
        label: "Engagement Plan",
        folder: S3_FOLDER.ENGAGEMENT_PLANS.value,
      },
      {
        name: "supportingEngagementPlan",
        label: "Supporting Documents for the Engagement Plan",
        folder: S3_FOLDER.ENGAGEMENT_PLAN_SUPPORTING_DOCUMENTS.value,
        description:
          "Must be unlocked PDF document (i.e., not password protected).",
      },
    ],
    [],
  );

  const sentRequests: SentRequest[] = useMemo(() => {
    if (!submissionPackage?.update_requests) return [];

    return submissionPackage.update_requests
      .filter((req) => req.active && req.submission_item_types.includes(submissionItem.type_id))
      .map((req) => ({
        updateRequestId: req.id,
        itemTypeId: submissionItem.type_id,
        itemTypeName: submissionItem.type.name,
        note: req.reason || req.note || "",
        createdDate: req.created_date,
        createdBy: req.created_by_user?.first_name + " " + req.created_by_user?.last_name || "Unknown",
        status: req.status,
      }));
  }, [submissionPackage?.update_requests, submissionItem]);

  const handleFlagSection = useCallback((itemTypeId: number, itemTypeName: string) => {
    setPendingRequests((prev) => {
      const exists = prev.find((r) => r.itemTypeId === itemTypeId);
      if (exists) return prev;
      return [...prev, { itemTypeId, itemTypeName, reason: "" }];
    });
  }, []);

  const handleRemoveFlag = useCallback((itemTypeId: number) => {
    setPendingRequests((prev) => prev.filter((r) => r.itemTypeId !== itemTypeId));
  }, []);

  const handleUpdateNote = useCallback((itemTypeId: number, reason: string) => {
    setPendingRequests((prev) =>
      prev.map((r) => (r.itemTypeId === itemTypeId ? { ...r, reason } : r)),
    );
  }, []);

  const handleSendRequests = useCallback(async () => {
    if (!submissionPackage) return;

    try {
      for (const request of pendingRequests) {
        await createUpdateRequest({
          packageId: submissionPackage.id,
          data: {
            submission_item_types: [request.itemTypeId],
            reason: request.reason,
          },
        });
      }

      notify.success("Update requests sent successfully");
      setPendingRequests([]);

      await queryClient.invalidateQueries({
        queryKey: getSubmissionPackageQueryOptions({
          packageId: submissionPackage.id,
        }).queryKey,
      });
    } catch (error) {
      notify.error("Failed to send update requests");
    }
  }, [pendingRequests, submissionPackage, createUpdateRequest, queryClient]);

  if (!accountProject) return <Navigate to="/error" />;
  if (!submissionPackage) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
        <Grid item xs={12}>
          <GenericDocumentUploadSection
            sections={documentUploadSections}
            onRequestUpdate={handleFlagSection}
            itemTypeId={submissionItem.type_id}
            itemTypeName={submissionItem.type.name}
          />
        </Grid>

        {(pendingRequests.length > 0 || sentRequests.length > 0) && (
          <Grid item xs={12}>
            <SectionUpdateRequestPanel
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
              onRemoveFlag={handleRemoveFlag}
              onSendRequests={handleSendRequests}
              onUpdateNote={handleUpdateNote}
              isLoading={isCreatingRequest}
            />
          </Grid>
        )}
      </Grid>
    </SubmissionFormContainer>
  );
};
