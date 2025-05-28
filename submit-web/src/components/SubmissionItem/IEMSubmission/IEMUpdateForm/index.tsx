import { Box, Button } from "@mui/material";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "../../DocumentsTable";
import { useState } from "react";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";

export const IEMUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const [isPendingUpload, setIsPendingUpload] = useState(false);

  const handleSaveAndExit = () => {
    navigate({
      to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}`,
    });
  };

  return (
    <SubmissionFormContainer>
      <Box width={"100%"}>
        <DocumentsTable
          folder={S3_FOLDER.IEMS.value}
          setIsPendingUpload={setIsPendingUpload}
        />
      </Box>
      <UnfinishedUploadsCheck customCondition={isPendingUpload}>
        <Button
          sx={{
            mt: "3em",
          }}
          onClick={handleSaveAndExit}
        >
          Save & Exit
        </Button>
      </UnfinishedUploadsCheck>
    </SubmissionFormContainer>
  );
};
