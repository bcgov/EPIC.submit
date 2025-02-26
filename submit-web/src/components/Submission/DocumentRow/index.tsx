import { useState } from "react";
import {
  Collapse,
  IconButton,
  Link as MuiLink,
  TableRow,
  Typography,
} from "@mui/material";
import { Submission } from "@/models/Submission";
import { SubmissionItem } from "@/models/SubmissionItem";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { StatusCell } from "./StatusCell";
import SubmissionItemReviewConfirmation from "../SubmissionItemReviewConfirmation";
import DocumentsSubTable from "../ItemsTable/DocumentsSubTable";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  submissionItem: SubmissionItem;
  staff?: boolean;
}>;

export default function DocumentRow({
  documentSubmission,
  submissionItem,
  staff = false,
}: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;

  const downloadDocument = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };

  const openDocument = () => {
    downloadDocument();
  };

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
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
                <MuiLink>{name}</MuiLink>
              </SubmissionItemReviewConfirmation>
            ) : (
              <MuiLink onClick={openDocument}>{name}</MuiLink>
            )}
          </Typography>
        </SubmitTableCell>
        <SubmitTableCell align="left" width={"10%"}>
          {submitted_by || ""}
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"10%"}>
          {version}
          <IconButton onClick={() => setExpanded(!expanded)} sx={{ p: 0 }}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "0.3s ease-in-out",
              }}
            />
          </IconButton>
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"20%"}>
          <StatusCell submittedDocument={documentSubmission} />
        </SubmitTableCell>
        <SubmitTableCell align="right" width={"10%"}></SubmitTableCell>
      </TableRow>
      <TableRow>
        <SubmitTableCell
          colSpan={6}
          style={{ paddingBottom: 0, paddingTop: 0, borderTop: "none" }}
        >
          <Collapse in={expanded} mountOnEnter unmountOnExit>
            <DocumentsSubTable submission={documentSubmission} />
          </Collapse>
        </SubmitTableCell>
      </TableRow>
    </>
  );
}
