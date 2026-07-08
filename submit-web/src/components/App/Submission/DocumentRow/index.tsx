import { Box, IconButton, TableRow, Typography, Button, Tooltip } from "@mui/material";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import {
  SubmitTableCell,
  SubmitTableRow,
} from "@/components/Shared/Table/common";
import { StatusCell } from "./StatusCell";
import SubmissionItemReviewConfirmation from "@/components/App/Submission/SubmissionItemReviewConfirmation";
import DocumentsSubTable from "@/components/App/Submission/ItemsTable/DocumentsSubTable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import UndoIcon from "@mui/icons-material/Undo";
import { ActionButton } from "./ActionButton";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { SubmissionPackage, PackageType } from "@/models/Package";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import ActionSplitButton, {
  SplitButtonAction,
} from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import { BCDesignTokens } from "epic.theme";
import { useDocumentRow } from "@/hooks/useDocumentRow";
import { usePackageRoles } from "@/hooks/usePackageRoles";
import { useState } from "react";
import { useAccount } from "@/store/accountStore";
import { lazy, Suspense } from "react";
import { GIS_ITEM_TYPE_NAME } from "@/utils/constants";
import { useGetGeoUploads } from "@/hooks/api/useGeo";

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
  const { roles } = useAccount();
  
  // Check if this is a GIS document (item type name "Geospatial Information")
  const isGISDocument = submissionItem.type.name === GIS_ITEM_TYPE_NAME;
  
  // Get the correct package-specific roles (include document folder for GIS handling)
  const packageRoles = usePackageRoles(submissionPackage, packageType, submitted_document?.folder);
  
  // Check if user has GIS permissions
  const hasGISPermissions = roles?.includes('gis_extended_edit') || roles?.includes('full_access');
  
  // State for GIS preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Get geo uploads for GIS preview
  const { data: geoUploads } = useGetGeoUploads({
    itemId: submissionItem.id,
    autoRefetch: false,
  });
  const uploads = geoUploads as any[];

  const {
    pendingGetObject,
    expanded,
    setExpanded,
    isPackageReadyForAcknowledgement,
    isAdditionalInfo,
    isNewVersion,
    showUndoVerificationButton,
    showUndoAcknowledgementButton,
    showDefaultActionButton,
    handleVerify,
    handleAcknowledge,
    handleUndoVerification,
    handleUndoAcknowledge,
    openDocument,
  } = useDocumentRow({
    documentSubmission,
    submissionPackage,
    packageType,
  });

  const getVerifyModeSplitButton = (): {
    primary: SplitButtonAction;
    secondary: SplitButtonAction[];
  } | null => {
    const status = documentSubmission.status;
    const smallIcon = { width: 16, height: 16 };

    if (
      status === SUBMISSION_STATUS.SUBMITTED ||
      (status === SUBMISSION_STATUS.PENDING && isNewVersion)
    ) {
      const secondary: SplitButtonAction[] = [];
      if (!isAdditionalInfo) {
        secondary.push({
          label: "Verify & Acknowledge",
          icon: (
            <DoneAllIcon
              fontSize="small"
              sx={{ color: BCDesignTokens.themeGray70 }}
            />
          ),
          onClick: handleAcknowledge,
        });
      }

      return {
        primary: {
          label: "Verify",
          icon: <CheckIcon sx={smallIcon} />,
          onClick: handleVerify,
        },
        secondary: isAdditionalInfo ? [] : secondary,
      };
    }

    if (status === SUBMISSION_STATUS.VERIFIED) {
      if (isAdditionalInfo) return null;
      return {
        primary: {
          label: "Acknowledge",
          icon: <CheckIcon sx={smallIcon} />,
          onClick: handleAcknowledge,
        },
        secondary: isAdditionalInfo
          ? [] // Link will be shown next to it instead of dropdown
          : [
            {
              label: "Undo Verification",
              icon: (
                <UndoIcon
                  fontSize="small"
                  sx={{ color: BCDesignTokens.themeGray70 }}
                />
              ),
              onClick: handleUndoVerification,
            },
          ],
      };
    }

    return null;
  };

  const splitButtonConfig =
    staff && (submissionPackage?.account_project_work || isAdditionalInfo)
      ? getVerifyModeSplitButton()
      : null;

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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography
              variant="body1"
              color="inherit"
              component="div"
              sx={{
                overflow: "clip",
                textOverflow: "ellipsis",
                cursor: "pointer",
                mx: 0.5,
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
            {isGISDocument && staff && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowPreviewModal(true)}
                sx={{ 
                  minWidth: "auto",
                  fontSize: "12px",
                  lineHeight: "18px",
                  textTransform: "none",
                  color: "#003366",
                  borderColor: "#003366",
                  borderRadius: "3px",
                  padding: "4px 12px",
                  fontFamily: "BC Sans",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#003366",
                    backgroundColor: "rgba(0, 51, 102, 0.04)",
                  }
                }}
              >
                Preview GIS File
              </Button>
            )}
          </Box>
        </SubmitTableCell>
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
            {showUndoVerificationButton && (
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
            {showUndoAcknowledgementButton && (
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
                    Undo Acknowledgement
                  </Typography>
                </Tooltip>
              ) : (
                <PermissionsGate scopes={[packageRoles.edit]}>
                  <Typography
                    variant="body2"
                    onClick={handleUndoAcknowledge}
                    sx={{
                      cursor: "pointer",
                      color: BCDesignTokens.typographyColorLink,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Undo Acknowledgement
                  </Typography>
                </PermissionsGate>
              )
            )}
            {splitButtonConfig ? (
              isGISDocument && !hasGISPermissions ? (
                <Tooltip title="Your current role does not allow you to perform this action">
                  <Box>
                    <ActionSplitButton
                      primaryAction={{
                        ...splitButtonConfig.primary,
                        onClick: () => {} // Disabled click
                      }}
                      secondaryActions={splitButtonConfig.secondary.map(action => ({
                        ...action,
                        onClick: () => {} // Disabled click
                      }))}
                      disabled
                    />
                  </Box>
                </Tooltip>
              ) : (
                <PermissionsGate scopes={[packageRoles.edit]}>
                  <ActionSplitButton
                    primaryAction={splitButtonConfig.primary}
                    secondaryActions={splitButtonConfig.secondary}
                  />
                </PermissionsGate>
              )
            ) : showDefaultActionButton ? (
              <PermissionsGate scopes={[packageRoles.edit]}>
                <ActionButton submission={documentSubmission} />
              </PermissionsGate>
            ) : null}
          </Box>
        </SubmitTableCell>
      </SubmitTableRow>
      {expanded && (
        <TableRow>
          <SubmitTableCell
            colSpan={6}
            style={{ paddingBottom: 0, paddingTop: 0, borderTop: "none" }}
          >
            <DocumentsSubTable submission={documentSubmission} />
          </SubmitTableCell>
        </TableRow>
      )}
      
      {/* GIS Preview Modal */}
      {isGISDocument && (
        <Suspense fallback={null}>
          <MapPreviewModal
            open={showPreviewModal}
            uploadId={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.id ?? null}
            documentItem={documentSubmission}
            fileSizeKb={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.file_size_kb}
            status={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.status}
            errorMessage={uploads?.find((u) => u.raw_s3_key === documentSubmission.submitted_document?.url)?.error_message}
            previewOnly={true}
            onClose={() => setShowPreviewModal(false)}
          />
        </Suspense>
      )}
    </>
  );
}
