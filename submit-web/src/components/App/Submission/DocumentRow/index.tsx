import { useState } from "react";
import { Box, IconButton, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
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
import { Unless } from "react-if";
import { SubmissionPackage } from "@/models/Package";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  submissionItem: SubmissionItem;
  staff?: boolean;
  submissionPackage?: SubmissionPackage;
}>;

export default function DocumentRow({
  documentSubmission,
  submissionItem,
  staff = false,
  submissionPackage,
}: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { submitted_document, version, minor_version, submitted_by } =
    documentSubmission;

  const name = submitted_document?.name || "";
  const url = submitted_document?.url || "";

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
          <Unless condition={submissionPackage?.completed_on}>
            <PermissionsGate scopes={[EPIC_SUBMIT_ROLE.eao_edit]}>
              <ActionButton submission={documentSubmission} />
            </PermissionsGate>
          </Unless>
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
    </>
  );
}
