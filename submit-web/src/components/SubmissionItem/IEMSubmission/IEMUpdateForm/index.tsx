import { Box, Button } from "@mui/material";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "../../DocumentsTable";
import { useState } from "react";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { getSubmissionFolderName } from "@/components/Shared/Table/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AccountProject } from "@/models/Project";
import { QUERY_KEY } from "@/hooks/api/constants";

export const IEMUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const [isPendingUpload, setIsPendingUpload] = useState(false);

  const queryClient = useQueryClient();
  const accountProject = queryClient.getQueryData<AccountProject>([
    QUERY_KEY.ACCOUNT_PROJECT,
    Number(projectId),
  ]);

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
            sectionName: S3_FOLDER.IEMS.value,
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
