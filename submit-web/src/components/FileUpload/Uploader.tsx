import React, { useState } from "react";
import { FormHelperText, Grid } from "@mui/material";
import Dropzone, { Accept } from "react-dropzone";
import { BCDesignTokens } from "epic.theme";

interface UploaderProps {
  height?: string;
  accept?: Accept;
  children: React.ReactNode;
  onDrop?: (acceptedFiles: File[]) => void;
  error?: boolean;
  maxSize?: number;
  maxFiles?: number;
  maxFilesErrorMessage?: string;
  currentFileCount?: number;
}
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const Uploader = ({
  height = "10em",
  accept = {},
  onDrop = () => {
    return;
  },
  error = false,
  children,
  maxSize = MAX_FILE_SIZE,
  maxFiles,
  maxFilesErrorMessage,
  currentFileCount = 0,
}: UploaderProps) => {
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [fileCountError, setFileCountError] = useState<string | null>(null);

  const clearErrors = () => {
    if (sizeError || fileCountError) {
      setSizeError(null);
      setFileCountError(null);
    }
  };

  return (
    <Dropzone
      maxSize={maxSize}
      onDrop={(acceptedFiles, rejectedFiles) => {
        // Check if any files exceed the maximum size
        const oversizedFiles = rejectedFiles.filter(
          (file) => file.file.size > maxSize
        );

        if (oversizedFiles.length > 0) {
          setSizeError(
            `This file exceeds the ${maxSize / (1024 * 1024)} MB limit.`
          );
          setFileCountError(null);
          return;
        }

        if (maxFiles && currentFileCount + acceptedFiles.length > maxFiles) {
          setFileCountError(
            maxFilesErrorMessage ||
              `You can only upload up to ${maxFiles} file${maxFiles > 1 ? "s" : ""}.`
          );
          setSizeError(null);
          return;
        }

        // Clear errors and proceed
        clearErrors();
        onDrop(acceptedFiles);
      }}
      accept={accept}
    >
      {({ getRootProps, getInputProps }) => (
        <section data-cy="uploader">
          <Grid
            {...getRootProps()}
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{
              padding: "0.38em",
              borderRadius: "8px",
              height: height,
              cursor: "pointer",
              background: error
                ? BCDesignTokens.supportSurfaceColorDanger
                : BCDesignTokens.themeBlue10,
              border: error
                ? `1px dashed ${BCDesignTokens.surfaceColorPrimaryDangerButtonDefault}`
                : `1px dashed ${BCDesignTokens.themeBlue60}`,
            }}
          >
            <input {...getInputProps()} multiple={false} />
            {children}
          </Grid>{" "}
          {sizeError && (
            <FormHelperText
              error
              style={{ textAlign: "left", marginTop: "8px" }}
            >
              {sizeError}
            </FormHelperText>
          )}{" "}
          {fileCountError && (
            <FormHelperText
              error
              style={{ textAlign: "left", marginTop: "8px" }}
            >
              {fileCountError}
            </FormHelperText>
          )}
        </section>
      )}
    </Dropzone>
  );
};

export default Uploader;
