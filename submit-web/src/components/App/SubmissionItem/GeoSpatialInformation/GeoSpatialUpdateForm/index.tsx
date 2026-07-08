import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { deleteDocument, S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "@/components/App/SubmissionItem/DocumentsTable";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { BCDesignTokens } from "epic.theme";
import { useGetGeoUploads, useApproveGeoUpload, GeoUpload } from "@/hooks/api/useGeo";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
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
  const [reviewQueue, setReviewQueue] = useState<Submission[]>([]);

  const { data: geoUploads } = useGetGeoUploads({
    itemId: Number(submissionItemId),
    autoRefetch: true,
  });
  const uploads = geoUploads as unknown as GeoUpload[];

  const { mutateAsync: approveGeoUpload } = useApproveGeoUpload();

  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);
  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );

  // Advances to the next file awaiting review
  const openNextInQueue = useCallback((queue: Submission[]) => {
    const [next, ...remaining] = queue;
    setReviewQueue(remaining);
    setPreviewDocument(next ?? null);
  }, []);

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
    if (previewDocument !== null) {
      setReviewQueue((prev) => [...prev, submission]);
    } else {
      setPreviewDocument(submission);
    }
  };

  const handleApprove = async () => {
    // Persist approval so back/refresh cannot bypass the review step.
    if (previewUpload) {
      try {
        await approveGeoUpload(previewUpload.id);
      } catch {
        notify.error("Failed to approve geospatial file.");
        return;
      }
    }
    openNextInQueue(reviewQueue);
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
      openNextInQueue(reviewQueue);
    }
  };

  // Re-open review for any upload left unapproved after a back/refresh. Runs
  // once per mount; in-session uploads are handled by onUploadComplete.
  const didSeedReview = useRef(false);
  useEffect(() => {
    if (didSeedReview.current) return;
    if (!uploads || !documentSubmissions) return;

    const unapproved = uploads.filter((u) => !u.is_approved);
    if (unapproved.length === 0) {
      didSeedReview.current = true;
      return;
    }

    const docs = unapproved
      .map((upload) =>
        documentSubmissions.find(
          (s) => s.submitted_document?.url === upload.raw_s3_key,
        ),
      )
      .filter((d): d is Submission => Boolean(d));

    if (docs.length < unapproved.length) return;

    didSeedReview.current = true;
    const [first, ...rest] = docs;
    setPreviewDocument(first);
    setReviewQueue(rest);
  }, [uploads, documentSubmissions]);

  const hasUnapprovedUploads = (uploads ?? []).some((u) => !u.is_approved);
  const isBlockedFromExit =
    isPendingUpload || previewDocument !== null || hasUnapprovedUploads;

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
          isApproved={previewUpload?.is_approved}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => openNextInQueue(reviewQueue)}
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
