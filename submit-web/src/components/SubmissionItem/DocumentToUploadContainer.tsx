import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React, { useEffect } from "react";
import DocumentIcon from "./ManagementPlanSubmission/DocumentIcon";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { saveObject } from "@/hooks/api/useObjectStorage";
import { createSubmission } from "@/hooks/api/useSubmissions";
import { Document, useDocumentUploadStore } from "@/store/documentUploadStore";
import { useParams } from "@tanstack/react-router";
import ProgressBar from "./ManagementPlanSubmission/ProgressBar";
import { useQueryClient } from "@tanstack/react-query";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { QUERY_KEY } from "@/hooks/api/constants";

interface DocumentContainerProps {
  document: Document;
}

const DocumentToUploadContainer: React.FC<DocumentContainerProps> = ({
  document,
}) => {
  const { submissionId: subItemId } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const queryClient = useQueryClient();

  const { triggerPending, completeDocument, removeDocument } =
    useDocumentUploadStore();

  useEffect(() => {
    triggerPending(document.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadObject = async () => {
    try {
      const uploadedFile = await saveObject({
        file: document.file,
        fileDetails: {
          filename: document.file.name,
        },
      });

      const documentData = {
        name: document.file.name,
        url: uploadedFile.filepath,
        folder: document.folder,
      };
      const documentSubmission = await createSubmission(Number(subItemId), {
        type: SUBMISSION_TYPE.DOCUMENT,
        data: documentData,
      });

      completeDocument(document.id, documentSubmission.id);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.SUBMISSION_ITEM, documentSubmission.item_id],
      });
    } catch (error) {
      notify.error("Failed to upload document");
      removeDocument(document.id);
    }
  };

  useEffect(() => {
    if (document.pending) {
      uploadObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.pending]);

  return (
    <Grid
      container
      item
      sx={{
        border: `1px solid #D6EBFF`,
        padding: BCDesignTokens.layoutPaddingSmall,
        mb: BCDesignTokens.layoutMarginSmall,
      }}
    >
      <Grid
        container
        item
        xs={11}
        alignItems={"center"}
        justifyContent={"flex-start"}
      >
        <Box
          sx={{
            mr: BCDesignTokens.layoutMarginLarge,
          }}
        >
          <DocumentIcon />
        </Box>
        <Box
          display={"flex"}
          flexDirection={"column"}
          width={"70%"}
          mr={BCDesignTokens.layoutMarginSmall}
        >
          <Typography
            variant="body1"
            fontWeight={BCDesignTokens.typographyFontWeightsBold}
            sx={{ color: "#222", mr: BCDesignTokens.layoutMarginSmall }}
          >
            {document.file.name}
          </Typography>{" "}
          <ProgressBar />
        </Box>
      </Grid>
      <Grid
        container
        item
        xs={1}
        alignItems={"center"}
        justifyContent={"flex-end"}
      >
        <Box
          sx={{
            cursor: "pointer",
            color: "#1A5A96",
            mr: BCDesignTokens.layoutMarginSmall,
          }}
          onClick={() => {
            return;
          }}
        >
          Remove
        </Box>
      </Grid>
    </Grid>
  );
};

export default DocumentToUploadContainer;
