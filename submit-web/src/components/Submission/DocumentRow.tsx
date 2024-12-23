import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "../Shared/Table/utils";
import { StyledTableCell } from "../Shared/Table/common";
import { openModal } from "../Shared/Modals/modalStore";
import ConfirmationModal from "../Shared/Modals/ConfirmationModal";
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

  const openVerificationModal = () => {
    //todo: setup onConfirm
    openModal(
      <ConfirmationModal
        onConfirm={() => {}}
        title={`Start ${submissionItem.name} Review`}
        description={`Would you like to start the ${submissionItem.name} review now? This will start the counter for the Review.`}
        confirmText={`Start ${submissionItem.name} Review`}
        cancelText="Start Later"
      />
    );
    return;
  };

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
    if (!submissionItem.review_start_date) {
      openVerificationModal();
    }
    downloadDocument();
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
          <MuiLink onClick={openDocument}>{name}</MuiLink>
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="right">{submitted_by || ""}</StyledTableCell>
      <StyledTableCell align="right">{version}</StyledTableCell>
      <StyledTableCell align="right" colSpan={2}></StyledTableCell>
    </TableRow>
  );
}
