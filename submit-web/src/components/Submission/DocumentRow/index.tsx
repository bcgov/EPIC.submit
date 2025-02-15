import { useState } from "react";
import {
  Collapse,
  Link as MuiLink,
  TableCell,
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
import DocumentSubRow from "../ItemsTable/DocumentSubRow";
import DocumentsSubTable from "../ItemsTable/DocumentsSubTable";

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
        <SubmitTableCell>
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
                packageId={submissionItem.package_id}
                itemType={submissionItem.type.name}
                onClick={openDocument}
                bypass={Boolean(submissionItem.review_start_date)}
              >
                <MuiLink>{name}</MuiLink>
              </SubmissionItemReviewConfirmation>
            ) : (
              <MuiLink onClick={openDocument}>{name}</MuiLink>
            )}
          </Typography>
        </SubmitTableCell>
        <SubmitTableCell align="right">{submitted_by || ""}</SubmitTableCell>
        <SubmitTableCell align="right" onClick={() => setExpanded(!expanded)}>
          {version}
        </SubmitTableCell>
        <SubmitTableCell align="right">
          <StatusCell
            submissionItem={submissionItem}
            submittedDocument={documentSubmission}
          />
        </SubmitTableCell>
        <SubmitTableCell align="right" colSpan={1}></SubmitTableCell>
      </TableRow>
      <TableRow>
        <SubmitTableCell
          colSpan={5}
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
