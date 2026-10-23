import { useMemo } from "react";
import { Box, Table, TableBody, Typography } from "@mui/material";
import { Accept } from "react-dropzone";
import { BCDesignTokens } from "epic.theme";
import { FileUpload } from "@/components/Shared/FileUpload";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import {
  SubmitTableCell,
  SubmitTableHead,
  SubmitTableHeadCell,
  SubmitTableRow,
} from "@/components/Shared/Table/common";
import {
  DEFAULT_MAX_FILE_SIZE_MB,
  EXTENSION_TO_MIME_TYPE_MAP,
} from "@/utils/constants";

export type StagedFile = {
  id: string;
  file: File;
};

const MAX_SIZE_BYTES = DEFAULT_MAX_FILE_SIZE_MB * 1024 * 1024;

const buildAccept = (acceptedFileTypes: string[]): Accept => {
  const accept: Accept = {};
  acceptedFileTypes.forEach((ext) => {
    const clean = ext.replace(/^\./, "").toLowerCase();
    const mimeTypes = EXTENSION_TO_MIME_TYPE_MAP[clean] || [
      "application/octet-stream",
    ];
    mimeTypes.forEach((mime) => {
      if (!accept[mime]) accept[mime] = [];
      if (!accept[mime].includes(`.${clean}`)) accept[mime].push(`.${clean}`);
    });
  });
  return accept;
};

type ReportUploadSectionProps = {
  heading: string;
  description: string;
  acceptedFileTypes: string[];
  uploadedByName: string;
  files: StagedFile[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  error?: boolean;
  dropZoneRef?: React.Ref<HTMLDivElement>;
};

/**
 * One upload section for the report add-document page: a drop zone, the
 * accepted-types/max-size caption, and a list of staged files (name, Uploaded
 * by, Remove). Files are staged client-side; nothing is uploaded here.
 */
export const ReportUploadSection = ({
  heading,
  description,
  acceptedFileTypes,
  uploadedByName,
  files,
  onAddFiles,
  onRemoveFile,
  error = false,
  dropZoneRef,
}: ReportUploadSectionProps) => {
  const accept = useMemo(
    () => buildAccept(acceptedFileTypes),
    [acceptedFileTypes],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="body1"
        color={BCDesignTokens.typographyColorPrimary}
        fontWeight={700}
      >
        {heading}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: BCDesignTokens.typographyColorPlaceholder, mb: 1 }}
      >
        {description}
      </Typography>

      <Box ref={dropZoneRef} tabIndex={-1}>
        <FileUpload
          height="13.125rem"
          accept={accept}
          maxSize={MAX_SIZE_BYTES}
          error={error}
          onDrop={onAddFiles}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{ color: BCDesignTokens.typographyColorPlaceholder, mt: 1 }}
      >
        Accepted file types: {acceptedFileTypes.join(", ")}. Max file size:{" "}
        {DEFAULT_MAX_FILE_SIZE_MB} MB.
      </Typography>

      {error && (
        <Typography
          variant="body2"
          sx={{ color: BCDesignTokens.typographyColorDanger, mt: 0.5 }}
        >
          Please upload a document.
        </Typography>
      )}

      {files.length > 0 && (
        <Box mt={2}>
          <Table sx={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <SubmitTableHead>
              <SubmitTableRow>
                <SubmitTableHeadCell>Document</SubmitTableHeadCell>
                <SubmitTableHeadCell align="left">
                  Uploaded by
                </SubmitTableHeadCell>
                <SubmitTableHeadCell align="right">Actions</SubmitTableHeadCell>
              </SubmitTableRow>
            </SubmitTableHead>
            <TableBody>
              {files.map((staged) => (
                <SubmitTableRow key={staged.id}>
                  <SubmitTableCell>{staged.file.name}</SubmitTableCell>
                  <SubmitTableCell align="left">
                    {uploadedByName}
                  </SubmitTableCell>
                  <SubmitTableCell align="right">
                    <LoadingButton
                      variant="text"
                      loading={false}
                      onClick={() => onRemoveFile(staged.id)}
                      sx={{ color: BCDesignTokens.typographyColorLink }}
                    >
                      Remove
                    </LoadingButton>
                  </SubmitTableCell>
                </SubmitTableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default ReportUploadSection;
