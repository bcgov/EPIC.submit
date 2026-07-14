import React, { useState } from "react";
import {
  Box,
  styled,
  TableCell,
  TableRow,
  TableRowProps,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { deleteDocument } from "@/hooks/api/useObjectStorage";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { Submission } from "@/models/Submission";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { useDeleteSubmission } from "@/hooks/api/useSubmissions";
import { useFileStore } from "@/store/fileStore";
import { useFormContext } from "react-hook-form";
import { getObjectFromS3 } from "@/components/Shared/Table/utils";
import { DocumentLink } from "@/components/Shared/DocumentLink";
import { GeoApprovedBadge } from "@/components/Shared/GeoApprovedBadge";

export const StyledHeadTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error }) => ({
  borderTop: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  borderBottom: error
    ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
    : `1px solid ${BCDesignTokens.themeBlue20}`,
  padding: `${BCDesignTokens.layoutPaddingXsmall} !important`,
  "&:first-of-type": {
    borderLeft: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  "&:last-of-type": {
    borderRight: error
      ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
      : `1px solid ${BCDesignTokens.themeBlue20}`,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
}));

export const DocumentHeadTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error }) => ({
  backgroundColor: error
    ? BCDesignTokens.supportSurfaceColorDanger
    : BCDesignTokens.themeBlue10,
  "&:hover": {
    backgroundColor: BCDesignTokens.themeBlue40,
  },
}));

export const DocumentTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(() => ({
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

type StyledTableRowProps = TableRowProps & { error?: boolean };
export const PackageTableRow = ({
  error,
  children,
  ...otherProps
}: StyledTableRowProps) => {
  // pass error to every child
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { error } as any)
      : child,
  );

  return <StyledTableRow {...otherProps}>{childrenWithProps}</StyledTableRow>;
};

type DocumentTableRowProps = Readonly<{
  documentItem: Submission;
  error?: boolean;
  formFieldName?: string;
  folder?: string;
  onDocumentClick?: (documentItem: Submission) => void;
}>;
export default function DocumentTableRow({
  documentItem,
  error = false,
  formFieldName,
  onDocumentClick,
}: DocumentTableRowProps) {
  const { submitted_by, version, submitted_document } = documentItem;
  const [pendingGetObject, setPendingGetObject] = useState(false);
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
  const { setValue, trigger, getValues } = useFormContext(); // Get form context directly
  const { removeFile } = useFileStore();
  const { mutateAsync: deleteSubmission } = useDeleteSubmission({
    submissionItemId: documentItem.item_id,
  });

  const downloadDocument = async () => {
    try {
      if (pendingGetObject || !submitted_document) return;
      setPendingGetObject(true);
      await getObjectFromS3({
        name: submitted_document.name,
        url: submitted_document.url,
      });
    } catch (e) {
      notify.error("Failed to download submission");
    } finally {
      setPendingGetObject(false);
    }
  };

  const updateFormField = async () => {
    if (!formFieldName || !submitted_document) return;

    const prev = getValues(formFieldName) as string[]; // get the current array
    const newValue = prev.filter(
      (value) =>
        value !== submitted_document.url && // filter out URL for uploaded documents
        value !== submitted_document.name, // filter out filename for pending documents
    );

    setValue(formFieldName, newValue, { shouldValidate: true });
    await trigger(formFieldName);
  };

  const onRemoveClick = async () => {
    try {
      setIsRemovingDocument(true);
      await deleteDocument({ filepath: submitted_document?.url ?? "" });
      await deleteSubmission(documentItem.id);
      removeFile(documentItem.id);

      // Update form if field name is provided
      await updateFormField();
    } catch (e) {
      notify.error("Failed to remove document");
    } finally {
      setIsRemovingDocument(false);
    }
  };

  return (
    <PackageTableRow
      key={`row-${documentItem.submitted_document?.name ?? ""}`}
      error={error}
    >
      <DocumentTableCell colSpan={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mx: 0.5,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="body1"
            color="inherit"
            component="div"
            sx={{
              overflow: "clip",
              textOverflow: "ellipsis",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <DocumentLink
              name={submitted_document?.name ?? ""}
              onClick={
                onDocumentClick
                  ? () => onDocumentClick(documentItem)
                  : downloadDocument
              }
              loading={pendingGetObject}
            />
          </Typography>
          <GeoApprovedBadge
            itemId={documentItem.item_id}
            url={submitted_document?.url}
            folder={submitted_document?.folder}
          />
        </Box>
      </DocumentTableCell>
      <DocumentTableCell align="right">{submitted_by}</DocumentTableCell>
      <DocumentTableCell align="right">{version}</DocumentTableCell>
      <DocumentTableCell align="center">
        <LoadingButton
          onClick={onRemoveClick}
          loading={isRemovingDocument}
          variant="text"
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
          Remove
        </LoadingButton>
      </DocumentTableCell>
    </PackageTableRow>
  );
}
