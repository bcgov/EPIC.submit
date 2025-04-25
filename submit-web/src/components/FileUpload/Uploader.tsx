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
}: UploaderProps) => {
  const [sizeError, setSizeError] = useState<string | null>(null);

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
        } else {
          setSizeError(null);
          onDrop(acceptedFiles);
        }
      }}
      accept={accept}
    >
      {({ getRootProps, getInputProps }) => (
        <section>
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
        </section>
      )}
    </Dropzone>
  );
};

export default Uploader;
