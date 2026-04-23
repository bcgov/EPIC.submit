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
import { ActionButton } from "./ActionButton";
import PermissionsGate from "@/components/Shared/PermissionGate";
import { EPIC_SUBMIT_ROLE } from "@/models/Role";
import { Switch, Case } from "react-if";
import { SubmissionPackage, PackageType } from "@/models/Package";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import ActionSplitButton, { VerifyMode } from "./ActionSplitButton";
import { useUpdateSubmissionStatus } from "@/hooks/api/useSubmissions";

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

  const name = submitted_document?.name || "";
  const url = submitted_document?.url || "";

  const { mutateAsync: verifySubmission } = useUpdateSubmissionStatus({
    submissionId: Number(documentSubmission.id),
    status: SUBMISSION_STATUS.VERIFIED,
  });

  // const { mutateAsync: acknowledgeSubmission } = useUpdateSubmissionStatus({
  //   submissionId: Number(documentSubmission.id),
  //   status: SUBMISSION_STATUS.ACKNOWLEDGED,
  // });

  // const { mutateAsync: undoVerify } = useUpdateSubmissionStatus({
  //   submissionId: Number(documentSubmission.id),
  //   status: SUBMISSION_STATUS.SUBMITTED,
  // });

  // const { mutateAsync: undoAcknowledge } = useUpdateSubmissionStatus({
  //   submissionId: Number(documentSubmission.id),
  //   status: SUBMISSION_STATUS.VERIFIED,
  // });

  const getVerifyMode = (): VerifyMode | null => {
    const status = documentSubmission.status;
    if (status === SUBMISSION_STATUS.SUBMITTED) {
      return "verify";
    }
    if (status === SUBMISSION_STATUS.VERIFIED) {
      return "acknowledge";
    }
    return null;
  };

  const verifyMode = submissionPackage?.account_project_work
    ? getVerifyMode()
    : null;

  const handleVerify = () => {
    verifySubmission({
      submissionId: documentSubmission.id,
      status: SUBMISSION_STATUS.VERIFIED,
    });
  };

  // const handleVerifyAndAcknowledge = () => {
  //   verifySubmission(documentSubmission.id, {
  //     onSuccess: () => {
  //       acknowledgeSubmission(documentSubmission.id, {
  //         onSuccess: () => notify.success("Document verified and acknowledged"),
  //         onError: () =>
  //           notify.error("Verified but failed to acknowledge document"),
  //       });
  //     },
  //     onError: () => notify.error("Failed to verify document"),
  //   });
  // };

  // const handleAcknowledge = () => {
  //   acknowledgeSubmission(documentSubmission.id, {
  //     onSuccess: () => notify.success("Document acknowledged"),
  //     onError: () => notify.error("Failed to acknowledge document"),
  //   });
  // };

  // const handleUndoVerification = () => {
  //   undoVerify(documentSubmission.id, {
  //     onSuccess: () => notify.success("Verification undone"),
  //     onError: () => notify.error("Failed to undo verification"),
  //   });
  // };

  // const handleUndoAcknowledge = () => {
  //   undoAcknowledge(documentSubmission.id, {
  //     onSuccess: () => notify.success("Acknowledgement undone"),
  //     onError: () => notify.error("Failed to undo acknowledgement"),
  //   });
  // };

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
        <SubmitTableCell width={"50%"}>
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
        <SubmitTableCell align="right" width={"20%"}>
          <Box mr={2}>
            <StatusCell submittedDocument={documentSubmission} />
          </Box>
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"10%"}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            <Switch>
              <Case condition={verifyMode !== null}>
                <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                  <ActionSplitButton
                    mode={verifyMode!}
                    onVerify={handleVerify}
                    onVerifyAndAcknowledge={() => {}}
                    onAcknowledge={() => {}}
                    onUndoVerification={() => {}}
                  />
                </PermissionsGate>
              </Case>
              <Case
                condition={
                  documentSubmission.status === SUBMISSION_STATUS.ACKNOWLEDGED
                }
              >
                <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                  <Typography
                    variant="body2"
                    onClick={() => {}}
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
              </Case>
              <Case condition={!submissionPackage?.completed_on}>
                <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
                  <ActionButton submission={documentSubmission} />
                </PermissionsGate>
              </Case>
            </Switch>
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
