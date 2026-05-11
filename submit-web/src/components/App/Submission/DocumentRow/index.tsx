import { Box, IconButton, TableRow, Typography } from "@mui/material";
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
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { SubmissionPackage, PackageType } from "@/models/Package";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import ActionSplitButton, {
  SplitButtonAction,
} from "@/components/Shared/ActionSplitButton/ActionSplitButton";
import { BCDesignTokens } from "epic.theme";
import { useDocumentRow } from "@/hooks/useDocumentRow";

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
    submissionPackage?.account_project_work || isAdditionalInfo
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
            {showUndoVerificationButton && (
              <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
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
            )}
            {showUndoAcknowledgementButton && (
              <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
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
            )}
            {splitButtonConfig ? (
              <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                <ActionSplitButton
                  primaryAction={splitButtonConfig.primary}
                  secondaryActions={splitButtonConfig.secondary}
                />
              </PermissionsGate>
            ) : showDefaultActionButton ? (
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
