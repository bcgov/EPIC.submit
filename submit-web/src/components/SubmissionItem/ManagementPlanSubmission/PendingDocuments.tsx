import { Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import DocumentToUploadContainer from "../DocumentToUploadContainer";

export const PendingDocuments = () => {
  const { documents } = useDocumentUploadStore();

  return (
    <Grid container sx={{ mb: BCDesignTokens.layoutMarginXlarge }}>
      {documents.map((document) => (
        <DocumentToUploadContainer key={document.id} document={document} />
      ))}
    </Grid>
  );
};
