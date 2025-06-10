import { Link as MuiLink, Typography } from "@mui/material";
import Row from "./Row";
import EmptyRow from "@/components/Projects/ProjectTable/EmptyRow";
import PendingRow from "./PendingRow";
import {
  SubmitPrimaryRowTableCell,
  SubmitTablePrimaryRow,
} from "@/components/Shared/Table/common";
import { useFileStore } from "@/store/fileStore";
import { BCDesignTokens } from "epic.theme";
import { useNavigate, useParams } from "@tanstack/react-router";

type InternalDocumentsProps = Readonly<{
  numColumns?: number;
  hideAction?: boolean;
  hideManageDocuments?: boolean;
}>;
export default function Rows({
  numColumns = 4,
  hideAction = false,
  hideManageDocuments = false,
}: InternalDocumentsProps) {
  const { projectId, submissionPackageId } = useParams({ strict: false });

  const { pendingFiles, files } = useFileStore();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({
      to: `/staff/projects/${projectId}/submission-packages/${submissionPackageId}/internal-documents`,
    });
  };

  return (
    <>
      <SubmitTablePrimaryRow>
        <SubmitPrimaryRowTableCell width={"100%"}>
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
        <SubmitPrimaryRowTableCell align="right" colSpan={numColumns - 1}>
          {!hideManageDocuments && (
            <>
              <Typography
                variant="body2"
                sx={{
                  color: BCDesignTokens.typographyColorLink,
                  "&:hover": {
                    cursor: "pointer",
                    textDecoration: "underline",
                  },
                  mx: 2,
                }}
                onClick={handleClick}
              >
                Add/Manage Documents
              </Typography>
            </>
          )}
        </SubmitPrimaryRowTableCell>
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
