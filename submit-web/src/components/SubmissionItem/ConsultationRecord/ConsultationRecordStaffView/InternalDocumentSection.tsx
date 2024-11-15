import FileUpload from "@/components/FileUpload";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import {
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useEffect, useState } from "react";
import InternalDocumentsTable from "../../InternalDocuments/Table";

export default function InternalDocumentSection() {
  const {
    reset,
    handleAddDocuments,
    documents: pendingDocuments,
  } = useDocumentUploadStore();
  const [link, setLink] = useState("");

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleChangeLinkText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLink(event.target.value);
  };

  const handleSaveLinkText = () => {
    if (!link) {
      console.log("Link is empty");
      return;
    }
    console.log(link);
  };

  const handleFileDrop = (acceptedFiles: File[]) => {
    if (pendingDocuments.length > 0) {
      return;
    }
    handleAddDocuments(acceptedFiles[0]);
  };
  return (
    <Grid item container>
      <Grid item xs={12}>
        <Typography
          variant="h5"
          fontWeight={400}
          sx={{ color: BCDesignTokens.typographyColorDisabled }}
        >
          Document Upload/Links
        </Typography>
        <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
        <Typography
          variant="body2"
          sx={{
            color: BCDesignTokens.typographyColorPrimary,
          }}
        >
          These documents will be accessible during your review and will be
          saved with the Management Plan Package.
        </Typography>
      </Grid>
      <Grid item xs={12} mt={"69px"}>
        <Typography variant="body1">Upload Documents</Typography>
      </Grid>
      <Grid item xs={12}>
        <FileUpload height="13.125rem" onDrop={handleFileDrop} />
        <Typography
          variant="body2"
          sx={{
            color: EAOColors.ProponentDark,
          }}
        >
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 250 MB.
        </Typography>
      </Grid>
      <Grid item xs={12} mt="60px">
        <Typography variant="body1">
          Add Link to Document on Sharepoint
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <TextField
            onChange={handleChangeLinkText}
            sx={{
              width: "600px",
            }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveLinkText}
          >
            Save Link
          </Button>
        </Stack>
      </Grid>
      <Grid item xs={12} mt="32px">
        <InternalDocumentsTable internalStaffDocuments={[]} />
      </Grid>
    </Grid>
  );
}
