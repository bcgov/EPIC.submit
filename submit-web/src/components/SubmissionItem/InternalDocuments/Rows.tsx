import { Link as MuiLink, Typography } from "@mui/material";
import { InternalStaffDocument } from "@/models/SubmissionItem";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import PendingRow from "./PendingRow";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useFileStore } from "@/store/fileStore";

type InternalDocumentsProps = Readonly<{
  numColumns?: number;
  hideAction?: boolean;
}>;
export default function Rows({
  numColumns = 4,
  hideAction = false,
}: InternalDocumentsProps) {
  const { pendingFiles, files } = useFileStore();

  return (
    <>
      <SubmitTablePrimaryRow>
        <SubmitPrimaryRowTableCell>
          <MuiLink
            color="inherit"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              color="inherit"
              fontWeight={900}
              sx={{ mx: 0.5 }}
            >
              EAO Internal Documents
            </Typography>
          </MuiLink>
        </SubmitPrimaryRowTableCell>
        <SubmitPrimaryRowTableCell align="right" colSpan={numColumns - 1} />
      </SubmitTablePrimaryRow>
      {files.map((document) => (
        <Row
          key={`doc-row-${document.id}`}
          internalStaffDocument={document}
          numColumns={5}
          hideAction={hideAction}
        />
      ))}
      {pendingFiles.map((pendingDocument) => (
        <PendingRow
          key={`pending-doc-row-${pendingDocument.id}`}
          pendingDocument={pendingDocument}
        />
      ))}
      <EmptyRow colSpan={5} />
    </>
  );
}
