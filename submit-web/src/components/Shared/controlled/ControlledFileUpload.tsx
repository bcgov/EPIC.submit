import { FileUploadProps, FileUpload } from "@/components/Shared/FileUpload";
import { FormHelperText, Stack } from "@mui/material";
import { get } from "lodash";
import { Controller, useFormContext } from "react-hook-form";

type ControlledFileUploadProps = FileUploadProps & {
  name: string;
  maxFiles?: number;
  maxFilesErrorMessage?: string;
};
export const ControlledFileUpload = ({
  name,
  maxFiles,
  maxFilesErrorMessage,
  onDrop,
  ...otherProps
}: ControlledFileUploadProps) => {
  const {
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useFormContext();

  const error = get(errors, name);
  const helperText = error?.message?.toString() ?? "";
  const currentFiles = getValues(name) ?? [];

  return (
    <Controller
      name={name}
      control={control}
      render={() => (
        <Stack direction={"column"} spacing={1}>
          <FileUpload
            {...otherProps}
            onDrop={(acceptedFiles: File[]) => {
              if (
                maxFiles &&
                currentFiles.length + acceptedFiles.length > maxFiles
              ) {
                // Handle error: maxFiles limit exceeded
                return;
              }
              if (acceptedFiles.length === 0) return;
              // Get current values and add the new file
              const currentValues = getValues(name) ?? [];
              const fileNames = acceptedFiles.map((file) => file.name);
              setValue(name, [...currentValues, ...fileNames], {
                shouldValidate: true,
              });
              onDrop(acceptedFiles);
            }}
            error={Boolean(error)}
            maxFiles={maxFiles}
            maxFilesErrorMessage={maxFilesErrorMessage}
            currentFileCount={currentFiles.length}
          />
          {error && <FormHelperText error>{helperText}</FormHelperText>}
        </Stack>
      )}
    />
  );
};

export default FileUpload;
