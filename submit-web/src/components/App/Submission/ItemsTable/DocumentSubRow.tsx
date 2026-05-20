import { useState } from "react";
import { Box, TableRow, Typography } from "@mui/material";
import { Submission } from "@/models/Submission";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { StatusCell } from "@/components/App/Submission/DocumentRow/StatusCell";
import { isAxiosError } from "axios";
import { DocumentLink } from "@/components/Shared/DocumentLink";

type DocumentRowProps = Readonly<{
  documentSubmission: Submission;
  onDocumentClick?: (documentItem: Submission) => void;
}>;

export default function DocumentSubRow({
  documentSubmission,
  onDocumentClick,
}: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);

  const { submitted_document, version, submitted_by } = documentSubmission;

  const { name, url, folder } = submitted_document || { name: "", url: "", folder: "" };

  const downloadDocument = async () => {
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

  const openDocument = () => {
    if (onDocumentClick && folder === "geospatial") {
      onDocumentClick(documentSubmission);
    } else {
      downloadDocument();
    }
  };

  return (
    <TableRow sx={{ height: "40px" }}>
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
          <DocumentLink
            name={name}
            onClick={openDocument}
            loading={pendingGetObject}
          />
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell align="left" width={"10%"}>
        {submitted_by || ""}
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"10%"}>
        {version}
        <span style={{ marginRight: "24px" }} />
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"20%"}>
        <Box mr={2}>
          <StatusCell submittedDocument={documentSubmission} />
        </Box>
      </SubmitTableCell>
      <SubmitTableCell align="right" width={"10%"}></SubmitTableCell>
    </TableRow>
  );
}
