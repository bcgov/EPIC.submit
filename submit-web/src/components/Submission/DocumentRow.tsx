import { Link as MuiLink, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { useState } from "react";
import { notify } from "../Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "../Shared/Table/utils";
import { StyledTableCell } from "../Shared/Table/common";
import { PACKAGE_STATUS } from "@/models/Package";
import { openModal } from "../Shared/Modals/modalStore";
import ConfirmationModal from "../Shared/Modals/ConfirmationModal";

type DocumentRowProps = {
  documentSubmission: Submission;
  submissionStatus?: string;
};

export default function DocumentRow({
  documentSubmission,
  submissionStatus,
}: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;

  const downloadDocument = async () => {
    try {
      if (submissionStatus === PACKAGE_STATUS.SUBMITTED.value) {
        openModal(
          <ConfirmationModal
            onConfirm={() => {}}
            title="Review Submission"
            description="Are you sure you want to review this submission? Once you start a review you will not be able to revert this management plan's status."
          />
        );
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
