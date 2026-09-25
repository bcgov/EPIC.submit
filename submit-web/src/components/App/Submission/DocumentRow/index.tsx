import { Box, Button, IconButton, TableRow, Typography, Tooltip } from "@mui/material";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";
import { SubmissionItem, SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import {
  SubmitTableCell,
  SubmitTableRow,
} from "@/components/Shared/Table/common";
import { StatusCell } from "./StatusCell";
import SubmissionItemReviewConfirmation from "@/components/App/Submission/SubmissionItemReviewConfirmation";
import DocumentsSubTable from "@/components/App/Submission/ItemsTable/DocumentsSubTable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ActionButton } from "./ActionButton";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { SubmissionPackage, PackageType } from "@/models/Package";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { GeoApprovedBadge } from "@/components/Shared/GeoApprovedBadge";
import { BCDesignTokens } from "epic.theme";
import { useDocumentRow } from "@/hooks/useDocumentRow";
import { usePackageRoles } from "@/hooks/usePackageRoles";
import { useState } from "react";
import { lazy, Suspense } from "react";
import { GIS_ITEM_TYPE_NAME } from "@/utils/constants";
import { useGetGeoUploads } from "@/hooks/api/useGeo";
import { useHasRole } from "@/hooks/common";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";

const MapPreviewModal = lazy(() =>
  import("@/components/App/Map/MapPreviewModal").then((m) => ({
    default: m.MapPreviewModal,
  })),
);

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  submissionItem: SubmissionItem;
  staff?: boolean;
  submissionPackage?: SubmissionPackage;
  packageType?: PackageType;
}>;

export default function DocumentRow({
  documentSubmission,
  submissionItem,
  staff = false,
  submissionPackage,
  packageType: propsPackageType,
}: DocumentRowProps) {
  const { submitted_document, version, minor_version, submitted_by } =
    documentSubmission;
  const packageType = propsPackageType || submissionPackage?.type;
  const name = submitted_document?.name || "";

  const isEAChecklist = submissionItem.type.name === SUBMISSION_ITEM_TYPE.EARLY_ENGAGEMENT_CHECKLIST;

  // Check if this is a GIS document (item type name "Geospatial Information")
  const isGISDocument = submissionItem.type.name === GIS_ITEM_TYPE_NAME;

  // Get the correct package-specific roles (include document folder for GIS handling)
  const packageRoles = usePackageRoles(submissionPackage, packageType, submitted_document?.folder);

  // Check if user has GIS permissions (includes full_access check)
  const hasGISPermissions = useHasRole(EPIC_SUBMIT_ROLE.gis_extended_edit);

  // State for GIS preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Get geo uploads for GIS preview
  const { data: geoUploads } = useGetGeoUploads({
    itemId: submissionItem.id,
    autoRefetch: false,
  });
  const uploads = geoUploads as any[];

  const previewUpload = uploads?.find(
    (u) => u.raw_s3_key === documentSubmission.submitted_document?.url,
  );

  const onPreviewClick = () => {
    if (!previewUpload) {
      notify.error("Preview is not available for this file.");
      return;
    }
    if (previewUpload.status === "processing") {
      notify.info("Geospatial processing is in progress. Please wait.");
      return;
    }
    setShowPreviewModal(true);
  };

  const {
    pendingGetObject,
    expanded,
    setExpanded,
    isPackageReadyForAcknowledgement,
    isAdditionalInfo,
    isNewVersion,
    showUndoVerificationButton,
    showDefaultActionButton,
    handleVerify,
    handleUndoVerification,
    openDocument,
  } = useDocumentRow({
    documentSubmission,
    submissionPackage,
    packageType,
  });

  const showVerifyButton =
    staff &&
    !isEAChecklist &&
    (submissionPackage?.account_project_work || isAdditionalInfo) &&
    (documentSubmission.status === SUBMISSION_STATUS.SUBMITTED ||
      (documentSubmission.status === SUBMISSION_STATUS.PENDING && isNewVersion));

  return (
    <>
      <SubmitTableRow
        sx={[
          expanded && {
            "& > *": { borderBottom: "unset" },
          },
          isPackageReadyForAcknowledgement && {
            backgroundColor: BCDesignTokens.supportSurfaceColorSuccess,
          },
        ]}
      >
        <SubmitTableCell width={"45%"}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mx: 0.5,
              overflow: "hidden",
            }}
          >
            <Typography
              variant="body1"
              color="inherit"
              component="div"
              sx={{
                overflow: "clip",
                textOverflow: "ellipsis",
                cursor: "pointer",
              }}
            >
              {staff ? (
                <SubmissionItemReviewConfirmation
                  submissionItem={submissionItem}
                  onClick={openDocument}
                >
                  <DocumentLink name={name} loading={pendingGetObject} />
                </SubmissionItemReviewConfirmation>
              ) : (
                <DocumentLink
                  name={name}
                  loading={pendingGetObject}
                  onClick={openDocument}
                />
              )}
            </Typography>
            {!staff && (
              <GeoApprovedBadge
                itemId={documentSubmission.item_id}
                url={submitted_document?.url}
                folder={submitted_document?.folder}
              />
            )}
          </Box >
        </SubmitTableCell >
        <SubmitTableCell align="left" width={"10%"}>
          {submitted_by || ""}
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"10%"}>
          {version}
          {minor_version > 1 ? (
            <IconButton onClick={() => setExpanded(!expanded)} sx={{ p: 0 }}>
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "0.3s ease-in-out",
                }}
              />
            </IconButton>
          ) : (
            <span style={{ marginRight: "24px" }} />
          )}
        </SubmitTableCell>
        <SubmitTableCell align="left" width={"18%"}>
          <Box ml={1}>
            <StatusCell
              submittedDocument={documentSubmission}
            />
          </Box>
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"17%"}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            {staff && isGISDocument && (
              <Tooltip title="Preview">
                <IconButton
                  onClick={onPreviewClick}
                  aria-label="Preview geospatial file"
                  size="small"
                  sx={{ color: BCDesignTokens.typographyColorLink }}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {staff && showUndoVerificationButton && (
              isGISDocument && !hasGISPermissions ? (
                <Tooltip title="Your current role does not allow you to perform this action">
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: "not-allowed",
                      color: BCDesignTokens.typographyColorPlaceholder,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Undo Verification
                  </Typography>
                </Tooltip>
              ) : (
                <PermissionsGate scopes={[packageRoles.edit]}>
                  <Typography
                    variant="body2"
                    onClick={handleUndoVerification}
                    sx={{
                      cursor: "pointer",
                      color: BCDesignTokens.typographyColorLink,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Undo Verification
                  </Typography>
                </PermissionsGate>
              )
            )}
            {showVerifyButton ? (
              isGISDocument && !hasGISPermissions ? (
                <Tooltip title="Your current role does not allow you to perform this action">
                  <Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<CheckIcon fontSize="small" />}
                      disabled
                    >
                      Verify
                    </Button>
                  </Box>
                </Tooltip>
              ) : (
                <PermissionsGate scopes={[packageRoles.edit]}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<CheckIcon fontSize="small" />}
                    onClick={handleVerify}
                  >
                    Verify
                  </Button>
                </PermissionsGate>
              )
            ) : showDefaultActionButton ? (
              <PermissionsGate scopes={[packageRoles.edit]}>
                <ActionButton submission={documentSubmission} />
              </PermissionsGate>
            ) : null}
          </Box>
        </SubmitTableCell>
      </SubmitTableRow >
      {expanded && (
        <TableRow>
          <SubmitTableCell
            colSpan={6}
            style={{ paddingBottom: 0, paddingTop: 0, borderTop: "none" }}
          >
            <DocumentsSubTable
              submission={documentSubmission}
              packageId={submissionPackage?.id}
            />
          </SubmitTableCell>
        </TableRow>
      )
      }

      {/* GIS Preview Modal */}
      {
        isGISDocument && (
          <Suspense fallback={null}>
            <MapPreviewModal
              open={showPreviewModal}
              uploadId={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.id ?? null}
              documentItem={documentSubmission}
              fileSizeKb={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.file_size_kb}
              status={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.status}
              errorMessage={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.error_message}
              validationErrors={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.validation_errors}
              previewOnly={true}
              onClose={() => setShowPreviewModal(false)}
            />
          </Suspense>
        )
      }
    </>
  );
}
