import { useState } from "react";
import { Box, IconButton, TableRow, Typography } from "@mui/material";
import { Submission, SUBMISSION_STATUS } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
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
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import {
  SubmissionPackage,
  PackageType,
  SubmissionPackageType,
  PACKAGE_STATUS,
} from "@/models/Package";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import ActionSplitButton, {
  SplitButtonAction,
} from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import { useUpdateSubmissionStatus } from "@/hooks/api/useSubmissions";
import { BCDesignTokens } from "epic.theme";

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
  const packageType = propsPackageType || submissionPackage?.type;
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { submitted_document, version, minor_version, submitted_by } =
    documentSubmission;

  const isPackageAcknowledged =
    submissionPackage?.status.includes(PACKAGE_STATUS.ACKNOWLEDGED.value) ||
    documentSubmission.status === SUBMISSION_STATUS.ACKNOWLEDGED;

  const name = submitted_document?.name || "";
  const url = submitted_document?.url || "";

  const { mutateAsync: updateSubmissionStatus } = useUpdateSubmissionStatus({
    packageId: submissionPackage?.id,
  });

  const handleVerify = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.VERIFIED,
      });
      notify.success("Document verified");
    } catch (e) {
      notify.error("Failed to verify document");
    }
  };

  const handleAcknowledge = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.ACKNOWLEDGED,
      });
      notify.success("Document acknowledged");
    } catch (e) {
      notify.error("Failed to acknowledge document");
    }
  };

  const handleUndoVerification = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.SUBMITTED,
      });
      notify.success("Verification undone");
    } catch (e) {
      notify.error("Failed to undo verification");
    }
  };

  const handleUndoAcknowledge = async () => {
    try {
      await updateSubmissionStatus({
        submissionId: documentSubmission.id,
        status: SUBMISSION_STATUS.VERIFIED,
      });
      notify.success("Acknowledgement undone");
    } catch (e) {
      notify.error("Failed to undo acknowledgement");
    }
  };

  const isAdditionalInfo =
    packageType?.name === SubmissionPackageType.ADDITIONAL_INFORMATION;

  const getVerifyModeSplitButton = (): {
    primary: SplitButtonAction;
    secondary: SplitButtonAction[];
  } | null => {
    const status = documentSubmission.status;
    const smallIcon = { width: 16, height: 16 };

    if (status === SUBMISSION_STATUS.SUBMITTED) {
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
          onClick: () => {}, // TODO: handleVerifyAndAcknowledge
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
    submissionPackage?.account_project_work || isAdditionalInfo
      ? getVerifyModeSplitButton()
      : null;

  const openDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (error) {
      const errorMessage = isAxiosError(error)
        ? (error.response?.data?.message ?? "Failed to download document")
        : "Failed to download document";
      notify.error(errorMessage);
    } finally {
      setPendingGetObject(false);
    }
  };

  return (
    <>
      <SubmitTableRow sx={[expanded && { "& > *": { borderBottom: "unset" } }]}>
        <SubmitTableCell width={"45%"}>
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
        <SubmitTableCell align="right" width={"15%"}>
          <Box mr={2}>
            <StatusCell submittedDocument={documentSubmission} />
          </Box>
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"20%"}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            {isAdditionalInfo &&
              !isPackageAcknowledged &&
              documentSubmission.status === SUBMISSION_STATUS.VERIFIED && (
                <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                  <Typography
                    variant="body2"
                    onClick={handleUndoVerification}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      textDecoration: "underline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Undo Verification
                  </Typography>
                </PermissionsGate>
              )}
            {!isAdditionalInfo &&
              documentSubmission.status === SUBMISSION_STATUS.ACKNOWLEDGED && (
                <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                  <Typography
                    variant="body2"
                    onClick={handleUndoAcknowledge}
                    sx={{
                      cursor: "pointer",
                      color: "primary.main",
                      textDecoration: "underline",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Undo Acknowledgement
                  </Typography>
                </PermissionsGate>
              )}
            {splitButtonConfig ? (
              <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                <ActionSplitButton
                  primaryAction={splitButtonConfig.primary}
                  secondaryActions={splitButtonConfig.secondary}
                />
              </PermissionsGate>
            ) : !submissionPackage?.completed_on &&
              documentSubmission.status !== SUBMISSION_STATUS.ACKNOWLEDGED ? (
              <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
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
            <DocumentsSubTable
              submission={documentSubmission}
              packageType={packageType}
            />
          </SubmitTableCell>
        </TableRow>
      )}
    </>
  );
}
