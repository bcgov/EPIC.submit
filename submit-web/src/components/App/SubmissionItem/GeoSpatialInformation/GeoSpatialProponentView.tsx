import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { BCDesignTokens } from "epic.theme";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { Grid } from "@mui/material";
import {
  GenericDocumentUploadSection,
  UploadSectionConfig,
} from "@/components/App/DocumentUpload/GenericDocumentUploadSection";
import { useMemo, useState, lazy, Suspense } from "react";
import Form from "@/components/Shared/Forms/common";
import { FormProvider, useForm } from "react-hook-form";
import { Submission } from "@/models/Submission";
import {
  GeoSpatialSubmissionForm,
  geospatialSubmissionSchema,
} from "./constants";
import { GeoSpatialGuidelines } from "./GeoSpatialGuidelines";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { QUERY_KEY } from "@/hooks/api/constants";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_TYPE,
  SubmissionItemStatus,
} from "@/models/Submission";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { isAxiosError } from "axios";
import SubmissionActionButtons from "@/components/App/SubmissionItem/SubmissionActionButtons";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
// Lazy-load the map modal so maplibre-gl is not downloaded until first use
const MapPreviewModal = lazy(() =>
  import("@/components/App/Map/MapPreviewModal").then((m) => ({
    default: m.MapPreviewModal,
  })),
);



export const GeoSpatialProponentView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);

  const navigate = useNavigate();

  const [isBackdropOpen, setIsBackdropOpen] = useState(false);
  const [previewUpload, setPreviewUpload] = useState<GeoUpload | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Submission | null>(
    null,
  );
  const { data: geoUploads } = useGetGeoUploads({
    itemId: Number(submissionItemId),
    autoRefetch: true,
  });
  const uploads = geoUploads as unknown as GeoUpload[];

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

  const defaultDocumentValues = useMemo(() => {
    if (!documentSubmissions) return {};

    return {
      geospatial: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document?.folder ===
            S3_FOLDER.GEOSPATIAL.value,
        )
        .map((submission) => submission.submitted_document?.url),
    };
  }, [documentSubmissions]);

  const methods = useForm<GeoSpatialSubmissionForm>({
    resolver: yupResolver(geospatialSubmissionSchema),
    mode: "onSubmit",
    defaultValues: {
      ...defaultDocumentValues,
    },
  });

  const { handleSubmit } = methods;

  const { refetch } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const { mutateAsync: callSaveSubmission } = useSaveSubmission({
    accountProjectId,
    submissionItem,
  });

  const handleCompleteForm = (formData: GeoSpatialSubmissionForm) => {
    saveSubmission(formData, SUBMISSION_ITEM_STATUS.COMPLETED.value);
  };

  const saveSubmission = async (
    _formData: GeoSpatialSubmissionForm,
    status: SubmissionItemStatus,
  ) => {
    try {
      setIsBackdropOpen(true);
      await callSaveSubmission({
        data: {
          type: SUBMISSION_TYPE.FORM,
          status,
          item_id: submissionItemId,
          data: {},
        },
      });

      await refetch();
      notify.success("Submission saved successfully");
      navigate({
        to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
    } catch (error) {
      const errorMessage =
        isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to save submission";
      notify.error(errorMessage);
    } finally {
      setIsBackdropOpen(false);
    }
  };

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

  if (!accountProject) return <Navigate to="/error" />;
  return (
    <SubmissionFormContainer>
      <SubmitLoaderBackdrop isOpen={isBackdropOpen} />
      <FormProvider {...methods}>
        <Form methods={methods}>
          <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
            <Grid item xs={12}>
              <GeoSpatialGuidelines />
            </Grid>
            <Grid item xs={12}>
              <GenericDocumentUploadSection
                sections={documentUploadSections}
                title="Geospatial File(s) Upload"
              />
            </Grid>

            {/* Map Preview Modal — lazy loaded, only downloads maplibre-gl on first open */}
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

            <SubmissionActionButtons
              onSubmit={handleSubmit(handleCompleteForm)}
              submitButtonText="Save & Exit"
            />
          </Grid>
        </Form>
      </FormProvider>
    </SubmissionFormContainer>
  );
};
