import {
  Link as MuiLink,
  styled,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { Submission } from "@/models/Submission";
import { downloadObject } from "@/hooks/api/useObjectStorage";
import { useState } from "react";
import { notify } from "../Shared/Snackbar/snackbarStore";

type DocumentRowProps = {
  documentSubmission: Submission;
};

const StyledTableCell = styled(TableCell)(() => ({
  borderTop: `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: `1px solid ${BCDesignTokens.themeBlue20}`,
  padding: `${BCDesignTokens.layoutPaddingXsmall} !important`,
  "&:first-of-type": {
    borderLeft: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

const StyledTableRow = styled(TableRow)(() => ({}));

export default function DocumentRow({ documentSubmission }: DocumentRowProps) {
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const {
    submitted_document: { name, url },
    version,
    submitted_by,
  } = documentSubmission;

  const getObjectFromS3 = async () => {
    try {
      if (pendingGetObject) return;
      setPendingGetObject(true);
      const response = await downloadObject({
        filename: name,
        s3sourceuri: url,
      });
      const linkUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = linkUrl;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
    } catch (e) {
      notify.error("Failed to download document");
    } finally {
      setPendingGetObject(false);
    }
  };
  return (
    <StyledTableRow>
      <StyledTableCell colSpan={2}>
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
          <MuiLink onClick={getObjectFromS3}>{name}</MuiLink>
        </Typography>
      </StyledTableCell>
      <StyledTableCell align="right">{submitted_by || ""}</StyledTableCell>
      <StyledTableCell align="right">{version}</StyledTableCell>
      <StyledTableCell align="right"></StyledTableCell>
      <StyledTableCell align="right"></StyledTableCell>
    </StyledTableRow>
  );
}
