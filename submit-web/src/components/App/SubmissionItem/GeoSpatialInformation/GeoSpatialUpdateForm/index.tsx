import { useState, lazy, Suspense } from "react";
import { Box, Button, Typography, Grid } from "@mui/material";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "@/components/App/SubmissionItem/DocumentsTable";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { BCDesignTokens } from "epic.theme";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
import { Submission, SUBMISSION_TYPE } from "@/models/Submission";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { QUERY_KEY } from "@/hooks/api/constants";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { GeoSpatialGuidelines } from "../GeoSpatialGuidelines";

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
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);

  const [isPendingUpload, setIsPendingUpload] = useState(false);
  const [previewUpload, setPreviewUpload] = useState<GeoUpload | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Submission | null>(null);

  const { data: geoUploads } = useGetGeoUploads({
    itemId: Number(submissionItemId),
    autoRefetch: true,
  });
  const uploads = geoUploads as unknown as GeoUpload[];

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
  };

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );

  const geoSubmissions =
    documentSubmissions?.filter(
      (submission) =>
        submission.submitted_document?.folder === S3_FOLDER.GEOSPATIAL.value,
    ) || [];

  const previewIndex = previewDocument
    ? geoSubmissions.findIndex((s) => s.id === previewDocument.id) + 1
    : 0;
  const totalGeoFiles = geoSubmissions.length;

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
          />
        </Box>
      </Box>

      {/* Map Preview Modal */}
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

      <UnfinishedUploadsCheck customCondition={isPendingUpload}>
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
