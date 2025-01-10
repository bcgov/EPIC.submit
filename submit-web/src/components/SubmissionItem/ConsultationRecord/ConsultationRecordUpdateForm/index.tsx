import { Box, Button } from "@mui/material";
import DocumentsTable from "./DocumentsTable";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";

export const ConsultationRecordUpdateForm = () => {
  const navigate = useNavigate();
  const { projectId, submissionPackageId } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  return (
    <SubmissionFormContainer>
      <Box width={"100%"}>
        <DocumentsTable />
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
