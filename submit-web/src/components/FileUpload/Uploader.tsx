import React, { useEffect } from "react";
import { Grid } from "@mui/material";
import Dropzone, { Accept } from "react-dropzone";
import { useFileUploadStore } from "@/store/fileUploadStore";

interface UploaderProps {
  height?: string;
  accept?: Accept;
  children: React.ReactNode;
}
const Uploader = ({
  height = "10em",
  accept = {},
  children,
}: UploaderProps) => {
  const { handleAddFile, addedFileUrl, setAddedFileUrl, setAddedFileName } =
    useFileUploadStore();

  useEffect(() => {
    return () => {
      if (addedFileUrl) {
        URL.revokeObjectURL(addedFileUrl);
      }
    };
  }, [addedFileUrl]);

  return (
    <Dropzone
      onDrop={(acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        const createdObjectURL = URL.createObjectURL(acceptedFiles[0]);
        handleAddFile(acceptedFiles);
        setAddedFileUrl(createdObjectURL);
        setAddedFileName(acceptedFiles[0].name);
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
              background: "#F6F9FC",
            }}
          >
            <input
              {...getInputProps()}
              multiple={false}
              accept={".pdf,.xlsx,.docx"}
            />
            {children}
          </Grid>
        </section>
      )}
    </Dropzone>
  );
};

export default Uploader;
