import { Box, Link as MuiLink, Typography } from "@mui/material";
import { SubmitTableCell } from "@/components/Shared/Table/common";
import { TableRow } from "@mui/material";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import { BCDesignTokens } from "epic.theme";
import LinkIcon from "@mui/icons-material/Link";
import { INTERNAL_STAFF_DOCUMENT_TYPE } from "@/models/SubmissionItem";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

type InternalDocumentItemRowProps = Readonly<{
  internalStaffDocument: InternalStaffDocument;
}>;

export default function InternalDocumentItemRow({
  internalStaffDocument,
}: InternalDocumentItemRowProps) {
  const { name, type, created_by_user, url } = internalStaffDocument;
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const handleDocumentClick = () => {
    if (type === INTERNAL_STAFF_DOCUMENT_TYPE.S3) {
      downloadDocument();
    } else if (type === INTERNAL_STAFF_DOCUMENT_TYPE.LINK) {
      navigateToLink();
    }
  };

  const navigateToLink = () => {
    window.open(url, "_blank");
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

  return (
    <TableRow>
      <SubmitTableCell width="50%">
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="body1"
            color="inherit"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              cursor: "pointer",
              mx: 0.5,
            }}
          >
            <MuiLink onClick={handleDocumentClick}>{name}</MuiLink>
          </Typography>
          {type === INTERNAL_STAFF_DOCUMENT_TYPE.LINK && (
            <LinkIcon htmlColor={BCDesignTokens.typographyColorLink} />
          )}
        </Box>
      </SubmitTableCell>
      <SubmitTableCell width="10%" align="left">
        <Typography variant="body1" color="inherit">
          {created_by_user.staff_user.first_name}{" "}
          {created_by_user.staff_user.last_name}
        </Typography>
      </SubmitTableCell>
      <SubmitTableCell width="10%" align="right" />
      <SubmitTableCell width="20%" align="center" />
      <SubmitTableCell width="10%" align="left" />
    </TableRow>
  );
}
