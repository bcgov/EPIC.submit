import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { BCDesignTokens } from "epic.theme";
import { Grid, Link, List, ListItem, Typography } from "@mui/material";
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
import { styled } from "@mui/material/styles";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
import { Submission } from "@/models/Submission";
import { GEO_DOC_LABELS, GEO_DOC_LINKS } from "./constants";

const MapPreviewModal = lazy(() =>
  import("@/components/App/Map/MapPreviewModal").then((m) => ({
    default: m.MapPreviewModal,
  })),
);

const StyledListItem = styled(ListItem)({
  padding: 2,
  display: "list-item",
  listStyleType: "disc",
  color: BCDesignTokens.themeBlue100,
});

export const GeoSpatialStaffView = () => {
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
  const [previewUpload, setPreviewUpload] = useState<GeoUpload | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Submission | null>(null);

  const { mutateAsync: createUpdateRequest, isPending: isCreatingRequest } =
    useCreatePackageUpdateRequest();

  const { data: geoUploads } = useGetGeoUploads({
    itemId: submissionId,
    autoRefetch: true,
  });
  const uploads = geoUploads as unknown as GeoUpload[];

  const documentUploadSections: UploadSectionConfig[] = useMemo(
    () => [
      {
        name: "geospatial",
        label: "Geospatial Files",
        folder: S3_FOLDER.GEOSPATIAL.value,
        acceptedFileTypes: ["shp", "zip"],
        acceptedFileTypesCriteria: "Must contain shape files",
        onDocumentClick: (documentItem) => {
          const url = documentItem.submitted_document?.url;
          if (!url) return;
          const upload = uploads?.find((u) => u.raw_s3_key === url);

          if (!upload) {
            notify.error("Preview is not available for this file.");
            return;
          }

          if (upload.status === "ready" || upload.status === "failed") {
            setPreviewUpload(upload);
            setPreviewDocument(documentItem);
          } else if (upload.status === "processing") {
            notify.info("Geospatial processing is in progress. Please wait.");
          } else {
            notify.error(
              upload.error_message || "Processing failed for this file.",
            );
          }
        },
      },
    ],
    [uploads],
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

  const geoSubmissions = submissionItem?.submissions?.filter(
    (submission) =>
      submission.submitted_document?.folder === S3_FOLDER.GEOSPATIAL.value,
  ) || [];

  const previewIndex = previewDocument
    ? geoSubmissions.findIndex((s) => s.id === previewDocument.id) + 1
    : 0;
  const totalGeoFiles = geoSubmissions.length;

  return (
    <SubmissionFormContainer>
      <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
        <Grid item xs={12}>
          <Typography variant="body2">
            Please download the EAO's{" "}
            <Link
              href={GEO_DOC_LINKS[GEO_DOC_LABELS.SPATIAL_GUIDELINE]}
              underline="always"
              sx={{ color: BCDesignTokens.themeBlue100 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Spacial Data Submission Guideline
            </Link>{" "}
            (PDF, 5.1MB) to understand GIS files requirements.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            You can also download these shape file templates to help you get
            started.
          </Typography>
          <List sx={{ pl: 4 }}>
            <StyledListItem>
              <Typography variant="body2">
                <Link
                  href={GEO_DOC_LINKS[GEO_DOC_LABELS.EAOShapeFiles]}
                  underline="always"
                  sx={{ color: BCDesignTokens.themeBlue100 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EAOShapeFiles
                </Link>
              </Typography>
            </StyledListItem>
            <StyledListItem>
              <Typography variant="body2">
                <Link
                  href={GEO_DOC_LINKS[GEO_DOC_LABELS.EAO_ESRI_FileGDB]}
                  underline="always"
                  sx={{ color: BCDesignTokens.themeBlue100 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EAO_ESRI_FileGDB
                </Link>{" "}
                (with domains - may be submitted as an alternative to
                individual shapefiles)
              </Typography>
            </StyledListItem>
            <StyledListItem>
              <Typography variant="body2">
                <Link
                  href={GEO_DOC_LINKS[GEO_DOC_LABELS.EOA_QGISGeopackage]}
                  underline="always"
                  sx={{ color: BCDesignTokens.themeBlue100 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EOA_QGISGeopackage
                </Link>{" "}
                (with domains)
              </Typography>
            </StyledListItem>
          </List>
        </Grid>
        <Grid item xs={12}>
          <GenericDocumentUploadSection
            sections={documentUploadSections}
            title="Geospatial File(s) Upload"
            onRequestUpdate={handleFlagSection}
            itemTypeId={submissionItem.type_id}
            itemTypeName={submissionItem.type.name}
          />
        </Grid>

        <Suspense fallback={null}>
          <MapPreviewModal
            uploadId={previewUpload?.id ?? null}
            documentItem={previewDocument}
            fileSizeKb={previewUpload?.file_size_kb}
            status={previewUpload?.status}
            errorMessage={previewUpload?.error_message}
            fileIndex={previewIndex}
            totalFiles={totalGeoFiles}
            onClose={() => {
              setPreviewUpload(null);
              setPreviewDocument(null);
            }}
          />
        </Suspense>

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
