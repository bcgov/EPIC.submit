import { useMemo, useState, lazy, Suspense } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { deleteDocument, S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "@/components/App/SubmissionItem/DocumentsTable";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { BCDesignTokens } from "epic.theme";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
import { Submission } from "@/models/Submission";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { GeoSpatialGuidelines } from "../GeoSpatialGuidelines";
import { useDeleteSubmission } from "@/hooks/api/useSubmissions";

const MapPreviewModal = lazy(() =>
  import("@/components/App/Map/MapPreviewModal").then((m) => ({
    default: m.MapPreviewModal,
  })),
);



export const GeoSpatialUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId, submissionId: submissionItemId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const [isPendingUpload, setIsPendingUpload] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Submission | null>(null);

  const { data: geoUploads } = useGetGeoUploads({
    itemId: Number(submissionItemId),
    autoRefetch: true,
  });
  const uploads = geoUploads as unknown as GeoUpload[];

  // Derive previewUpload reactively so the modal updates as polling resolves status
  const previewUpload = useMemo<GeoUpload | null>(() => {
    if (!previewDocument || !uploads) return null;
    return (
      uploads.find(
        (u) => u.raw_s3_key === previewDocument.submitted_document?.url,
      ) ?? null
    );
  }, [previewDocument, uploads]);

  const { mutateAsync: deleteSubmissionAsync } = useDeleteSubmission({
    submissionItemId: Number(submissionItemId),
  });

  const handleSaveAndExit = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}`,
    });
  };

  const handleDocumentClick = (documentItem: Submission) => {
    const url = documentItem.submitted_document?.url;
    if (!url) return;
    const upload = uploads?.find((u) => u.raw_s3_key === url);

    if (!upload) {
      notify.error("Preview is not available for this file.");
      return;
    }

    if (upload.status === "processing") {
      notify.info("Geospatial processing is in progress. Please wait.");
      return;
    }

    setPreviewDocument(documentItem);
  };

  // Called by AddDocumentActionButton once a geo file finishes uploading
  const onUploadComplete = (submission: Submission) => {
    setPreviewDocument(submission);
  };

  const handleApprove = () => {
    setPreviewDocument(null);
  };

  const handleReject = async () => {
    if (!previewDocument) return;
    const filepath = previewDocument.submitted_document?.url ?? "";
    try {
      await deleteDocument({ filepath });
      await deleteSubmissionAsync(previewDocument.id);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, Number(submissionItemId)],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.GEO_UPLOADS] });
      notify.success("Geospatial file rejected and removed.");
    } catch {
      notify.error("Failed to remove geospatial file.");
    } finally {
      setPreviewDocument(null);
    }
  };

  const isBlockedFromExit = isPendingUpload || previewDocument !== null;

  return (
    <SubmissionFormContainer>
      <Box width={"100%"} display="flex" flexDirection="column" gap={4}>
        <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
          <Grid item xs={12}>
            <GeoSpatialGuidelines />
          </Grid>
        </Grid>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: BCDesignTokens.typographyColorPrimary,
            }}
          >
            Geospatial File(s)
          </Typography>
          <DocumentsTable
            folder={S3_FOLDER.GEOSPATIAL.value}
            setIsPendingUpload={setIsPendingUpload}
            isGeoSpatial={true}
            onDocumentClick={handleDocumentClick}
            onUploadComplete={onUploadComplete}
          />
        </Box>
      </Box>

      {/* Map Preview Modal */}
      <Suspense fallback={null}>
        <MapPreviewModal
          open={previewDocument !== null}
          uploadId={previewUpload?.id ?? null}
          documentItem={previewDocument}
          fileSizeKb={previewUpload?.file_size_kb}
          status={
            previewUpload?.status ??
            (previewDocument !== null ? "processing" : undefined)
          }
          errorMessage={previewUpload?.error_message}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </Suspense>

      <UnfinishedUploadsCheck customCondition={isBlockedFromExit}>
        <Button
          sx={{
            mt: "3em",
            width: "fit-content",
          }}
          onClick={handleSaveAndExit}
        >
          Save & Exit
        </Button>
      </UnfinishedUploadsCheck>
    </SubmissionFormContainer>
  );
};
