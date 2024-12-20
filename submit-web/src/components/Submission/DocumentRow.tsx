import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "../Shared/Table/utils";
import { StyledTableCell } from "../Shared/Table/common";
import { PACKAGE_STATUS } from "@/models/Package";
import { openModal } from "../Shared/Modals/modalStore";
import ConfirmationModal from "../Shared/Modals/ConfirmationModal";
import { SUBMISSION_ITEM_TYPE } from "@/models/SubmissionItem";
import { SubmissionItemTableRow } from "./types";

type DocumentRowProps = {
  documentSubmission: Submission;
  submissionItem: SubmissionItemTableRow;
};

export default function DocumentRow({
  documentSubmission,
  submissionItem,
}: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;
  const hasReviewStarted = submissionItem.review_start_date !== null;

  const downloadDocument = async () => {
    try {
      if (!hasReviewStarted) {
        //TODO: on confirm update status in next pr
        if (submissionItem.name === SUBMISSION_ITEM_TYPE.MANAGEMENT_PLAN) {
          openModal(
            <ConfirmationModal
              onConfirm={() => {}}
              title="Start Management Plan Review"
              description="Would you like to start the Management Plan Review now? This will start the counter for the MP Review."
              confirmText="Start Consultation Check"
              cancelText="Start Later"
            />
          );
        }
        if (submissionItem.name === SUBMISSION_ITEM_TYPE.CONSULTATION_RECORD) {
          openModal(
            <ConfirmationModal
              onConfirm={() => {}}
              title="Start Consultation Check"
              description="Would you like to start the Consultation Check now?"
              confirmText="Start Consultation Check"
              cancelText="Start Later"
            />
          );
        }
        return;
      }
      if (pendingGetObject) return;
      setPendingGetObject(true);
      await getObjectFromS3({ name, url });
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };
  return (
    <TableRow>
      <StyledTableCell>
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
          <MuiLink onClick={downloadDocument}>{name}</MuiLink>
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="right">{submitted_by || ""}</StyledTableCell>
      <StyledTableCell align="right">{version}</StyledTableCell>
      <StyledTableCell align="right" colSpan={2}></StyledTableCell>
    </TableRow>
  );
}
