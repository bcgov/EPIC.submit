import { Box, Button } from "@mui/material";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "../../DocumentsTable";

export const ManagementPlanUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  return (
    <SubmissionFormContainer>
      <Box width={"100%"}>
        <DocumentsTable folder={S3_FOLDER.CONSULTATION_RECORDS} />
      </Box>
      <Button
        sx={{
          mt: "3em",
        }}
        onClick={() =>
          navigate({
            to: `/proponent/projects/${projectId}/submission-packages/${submissionPackageId}`,
          })
        }
      >
        Save & Exit
      </Button>
    </SubmissionFormContainer>
  );
};
