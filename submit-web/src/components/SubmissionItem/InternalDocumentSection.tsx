import FileUpload from "@/components/FileUpload";
import { Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useEffect, useMemo } from "react";
import InternalDocumentsTable from "./InternalDocuments/Table";
import { useQueryClient } from "@tanstack/react-query";
import { getSubmissionItemForStaffQueryOptions } from "@/hooks/api/useItems";
import { useParams } from "@tanstack/react-router";
import { useFileStore } from "@/store/fileStore";
import AddFileLinkSection from "./AddFileLinkSection";

export default function InternalDocumentSection() {
  const { submissionId: subItemId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { reset, addPendingFile, pendingFiles, initializeFiles } =
    useFileStore();

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData(
    getSubmissionItemForStaffQueryOptions({ itemId: Number(subItemId) })
      .queryKey
  );
  const internalStaffDocuments = useMemo(() => {
    return submissionItem?.internal_staff_documents || [];
  }, [submissionItem]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    initializeFiles(internalStaffDocuments);
  }, [internalStaffDocuments, initializeFiles]);

  const handleFileDrop = (acceptedFiles: File[]) => {
    if (pendingFiles.length > 0) {
      return;
    }
    addPendingFile(acceptedFiles[0]);
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
        <AddFileLinkSection submissionItemId={Number(subItemId)} />
      </Grid>
      <Grid item xs={12} mt="32px">
        <InternalDocumentsTable />
      </Grid>
    </Grid>
  );
}
