import { VisuallyHiddenInput } from "./VisuallyHiddenInput";
import { BCDesignTokens } from "epic.theme";
import { LoadingButton } from "@/components/Shared/LoadingButton";

type FileUploadButtonProps = {
  onChange: (file: FileList) => void;
  children: React.ReactNode;
  multiple?: boolean;
  loading?: boolean;
};
export const FileUploadButton = ({
  onChange,
  children,
  multiple = false,
  loading = false,
}: FileUploadButtonProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files === null) return;
    onChange(files);
  };

  return (
    <LoadingButton
      component="label"
      role={undefined}
      variant="text"
      tabIndex={-1}
      loading={loading}
      sx={{
        color: BCDesignTokens.typographyColorLink,
        "&:hover": {
          backgroundColor: "transparent",
        },
        "&:focus": {
          outline: "none",
        },
      }}
    >
      {children}
      <VisuallyHiddenInput
        type="file"
        onChange={(e) => handleFileChange(e)}
        multiple={multiple}
      />
    </LoadingButton>
  );
};
