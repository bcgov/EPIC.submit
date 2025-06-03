import { Box, Button } from "@mui/material";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "../../DocumentsTable";
import { useState } from "react";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "@/hooks/api/constants";
import { AccountProject } from "@/models/Project";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";

export const ConsultationRecordUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>([
    QUERY_KEY.ACCOUNT_PROJECT,
    Number(projectId),
  ]);

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
          folder={getSubmissionFolderName({
            projectName: accountProject?.project.name ?? "",
            sectionName: S3_FOLDER.CONSULTATION_RECORDS.value,
          })}
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
