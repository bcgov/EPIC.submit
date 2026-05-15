import { Box, Button, Typography } from "@mui/material";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { useNavigate, useParams } from "@tanstack/react-router";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import DocumentsTable from "@/components/App/SubmissionItem/DocumentsTable";
import { useState } from "react";
import { UnfinishedUploadsCheck } from "@/components/Shared/UnfinishedUploadsCheck";
import { BCDesignTokens } from "epic.theme";

export const EngagementPlanUpdateForm = () => {
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
      <Box width={"100%"} display="flex" flexDirection="column" gap={4}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: BCDesignTokens.typographyColorPrimary,
            }}
          >
            Engagement Plan
          </Typography>
          <DocumentsTable
            folder={S3_FOLDER.ENGAGEMENT_PLANS.value}
            setIsPendingUpload={setIsPendingUpload}
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: BCDesignTokens.typographyColorPrimary,
            }}
          >
            Supporting Documents for the Engagement Plan
          </Typography>
          <DocumentsTable
            folder={S3_FOLDER.ENGAGEMENT_PLAN_SUPPORTING_DOCUMENTS.value}
            setIsPendingUpload={setIsPendingUpload}
          />
        </Box>
      </Box>
      <UnfinishedUploadsCheck customCondition={isPendingUpload}>
        <Button
          sx={{
            mt: "3em",
            width: "fit-content",
          }}
          onClick={handleSaveAndExit}
        >
          Save & Exit
        </Button>
      </UnfinishedUploadsCheck>
    </SubmissionFormContainer>
  );
};
