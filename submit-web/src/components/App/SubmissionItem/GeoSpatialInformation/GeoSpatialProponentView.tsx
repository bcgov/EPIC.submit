import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { BCDesignTokens } from "epic.theme";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import {
  Grid,
  Link,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import {
  GenericDocumentUploadSection,
  UploadSectionConfig,
} from "@/components/App/DocumentUpload/GenericDocumentUploadSection";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import Form from "@/components/Shared/Forms/common";
import { FormProvider, useForm } from "react-hook-form";
import {
  GEO_DOC_LABELS,
  GEO_DOC_LINKS,
  GeoSpatialSubmissionForm,
  geospatialSubmissionSchema,
} from "./constants";
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
import { styled } from "@mui/material/styles";
import { useGetGeoUploads, GeoUpload } from "@/hooks/api/useGeo";
import { useUploadStatus } from "@/hooks/api/useUploadStatus";
// Lazy-load the map modal so maplibre-gl is not downloaded until first use
const MapPreviewModal = lazy(() =>
  import("@/components/App/Map/MapPreviewModal").then((m) => ({
    default: m.MapPreviewModal,
  }))
);
import { submitRequest } from "@/utils/axiosUtils";

const StyledListItem = styled(ListItem)({
  padding: 2,
  display: "list-item",
  listStyleType: "disc",
  color: BCDesignTokens.themeBlue100,
});

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
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const { data: geoUploads, refetch: refetchGeoUploads } = useGetGeoUploads();
  const uploads = geoUploads as unknown as GeoUpload[];

  // Track the status of the latest upload
  useUploadStatus(trackingId, {
    onReady: (id) => {
      setPreviewId(id);
      setTrackingId(null);
      refetchGeoUploads();
    },
    onFailed: () => {
      setTrackingId(null);
      refetchGeoUploads();
    },
  });

  // Automatically start tracking if a new 'processing' upload appears
  useEffect(() => {
    if (uploads && uploads.length > 0) {
      const latest = uploads[0];
      if (latest.status === "processing" && latest.id !== trackingId) {
        setTrackingId(latest.id);
      }
    }
  }, [uploads, trackingId]);

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );

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

  const {
    handleSubmit,
    formState: { dirtyFields },
  } = methods;

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

  const triggerGeoProcess = async () => {
    try {
      await submitRequest({
        url: `/submissions/items/${submissionItemId}/geo-process`,
        method: "post",
      });
    } catch (e) {
      console.error("Failed to trigger geo processing on submission item", e);
    }
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

      // Trigger geospatial processing for this submission item
      await triggerGeoProcess();
      // Refresh local state to capture new processing tags
      refetchGeoUploads();

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

  const saveAndClose = async () => {
    // Guaranteed to capture background uploaded files that didn't trigger dirtyFields
    await triggerGeoProcess();

    if (!Object.keys(dirtyFields).length) {
      navigate({
        to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
      return;
    }
    const formData = {
      ...methods.getValues(),
    };

    saveSubmission(formData, SUBMISSION_ITEM_STATUS.PARTIALLY_COMPLETED.value);
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
          
          if (upload.status === "ready") {
            setPreviewId(upload.id);
          } else if (upload.status === "processing") {
            notify.info("Geospatial processing is in progress. Please wait.");
          } else {
            notify.error("Processing failed for this file.");
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
              <Typography variant="body2">
                Please download the EAO’s{" "}
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
              />
            </Grid>



            {/* Map Preview Modal — lazy loaded, only downloads maplibre-gl on first open */}
            <Suspense fallback={null}>
              <MapPreviewModal
                uploadId={previewId}
                onClose={() => setPreviewId(null)}
              />
            </Suspense>

            <SubmissionActionButtons
              onSubmit={handleSubmit(handleCompleteForm)}
              saveAndClose={saveAndClose}
            />
          </Grid>
        </Form>
      </FormProvider>
    </SubmissionFormContainer>
  );
};
