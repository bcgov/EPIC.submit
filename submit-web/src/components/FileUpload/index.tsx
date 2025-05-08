import Uploader from "./Uploader";
import { Accept } from "react-dropzone";
import { Box, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import UploaderIcon from "./UploaderIcon";

export type FileUploadProps = {
  height?: string;
  accept?: Accept;
  onDrop: (acceptedFiles: File[]) => void;
  error?: boolean;
  maxFiles?: number;
  maxFilesErrorMessage?: string;
  currentFileCount?: number;
};
export const FileUpload = ({
  height = "10em",
  accept = {
    "application/pdf": [],
    "application/msword": [],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      [],
    "application/vnd.ms-excel": [],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
  },
  error = false,
  onDrop,
  maxFiles,
  maxFilesErrorMessage,
  currentFileCount
}: FileUploadProps) => {
  return (
    <Uploader
      height={height}
      accept={accept}
      onDrop={onDrop}
      error={error}
      maxFiles={maxFiles}
      maxFilesErrorMessage={maxFilesErrorMessage}
      currentFileCount={currentFileCount}
    >
      <Box sx={{ p: BCDesignTokens.layoutPaddingSmall }}>
        <UploaderIcon />
      </Box>
      <Typography
        variant="body1"
        fontWeight={BCDesignTokens.typographyFontWeightsBold}
        sx={{ color: BCDesignTokens.typographyColorSecondary }}
      >
        Drag and Drop a File Here or{" "}
        <span
          style={{
            textDecoration: "underline",
            color: "#1A5A96",
          }}
        >
          Select a File
        </span>
      </Typography>
    </Uploader>
  );
};

export default FileUpload;
