import FileUpload from "@/components/FileUpload";
import { Button, Grid, Typography } from "@mui/material";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { BCDesignTokens, EAOColors } from "epic.theme";
import { useEffect, useMemo } from "react";
import InternalDocumentsTable from "./InternalDocuments/Table";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useFileStore } from "@/store/fileStore";
import AddFileLinkSection from "./AddFileLinkSection";
import { useGetStaffSubmissionPackage } from "@/hooks/api/usePackages";

export default function InternalDocumentSection() {
  const navigate = useNavigate();
  const { submissionPackageId } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/internal-documents/",
  });

  const { reset, addPendingFile, initializeFiles } = useFileStore();

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const { data: submissionPackage } = useGetStaffSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const internalStaffDocuments = useMemo(
    () => submissionPackage?.internal_staff_documents || [],
    [submissionPackage]
  );

  useEffect(() => {
    initializeFiles(internalStaffDocuments);
  }, [internalStaffDocuments, initializeFiles]);

  const handleFileDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      addPendingFile(file);
    });
  };

  return (
    <Grid item container>
      <Grid item xs={12}>
        <BarBlueTitle title="EAO Internal Documents" fullWidth bold={false} />
        <Typography
          variant="body2"
          sx={{
            color: BCDesignTokens.typographyColorPrimary,
            mt: BCDesignTokens.layoutMarginXsmall,
          }}
        >
          These documents will be accessible during your review and will be
          saved with the submission Package.
        </Typography>
      </Grid>
      <Grid item xs={12} mt={BCDesignTokens.layoutMarginXlarge}>
        <Typography variant="body1">Upload Documents</Typography>
      </Grid>
      <Grid item xs={12}>
        <FileUpload height="13.125rem" onDrop={handleFileDrop} maxFiles={10} />
        <Typography
          variant="body2"
          sx={{
            color: EAOColors.ProponentDark,
          }}
        >
          Accepted file types: pdf, doc, docx, xlsx. Max. file size: 500 MB.
        </Typography>
      </Grid>
      <Grid item xs={12} mt="60px">
        <Typography variant="body1" fontWeight={800}>
          Add Link to Document on Sharepoint
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <AddFileLinkSection packageId={Number(submissionPackageId)} />
      </Grid>
      <Grid item xs={12} mt="32px">
        <InternalDocumentsTable hideManageDocuments={true} />
      </Grid>
      <Grid item xs={12} mt="32px">
        <Button
          color="secondary"
          onClick={() =>
            navigate({
              to: `/staff/projects/${submissionPackage?.account_project_id}/submission-packages/${submissionPackageId}`,
            })
          }
        >
          Close
        </Button>
      </Grid>
    </Grid>
  );
}
