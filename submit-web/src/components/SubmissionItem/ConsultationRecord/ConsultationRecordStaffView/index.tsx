import { useEffect, useMemo } from "react";
import { Navigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { booleanToString } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { Box, Grid, Typography } from "@mui/material";
import { ContentBox } from "@/components/Shared/ContentBox";
import { BCDesignTokens } from "epic.theme";
import { CardInnerBox } from "@/components/Projects/Project";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import BarTitle from "@/components/Shared/Text/BarTitle";
import FormFieldSection from "./FormFieldSection";
import ActionButtons from "./ActionButtons";

export const ConsultationRecordStaffView = () => {
  const { projectId: accountProjectIdParam, submissionId: submissionItemId } =
    useParams({
      from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
    });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const { reset } = useDocumentUploadStore();

  const queryClient = useQueryClient();

  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    "item",
    Number(submissionItemId),
  ]);

  const formSubmission = submissionItem?.submissions?.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM
  );

  const defaultFormValues = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      allPartiesConsulted: booleanToString(
        formSubmission.submitted_form.submission_json.allPartiesConsulted
      ),
      planWasReviewed: booleanToString(
        formSubmission.submitted_form.submission_json.planWasReviewed
      ),
      writtenExplanationsProvidedToParties: booleanToString(
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToParties
      ),
      writtenExplanationsProvidedToCommenters: booleanToString(
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToCommenters
      ),
    };
  }, [formSubmission]);

  useEffect(() => {
    console.log(formSubmission);
  }, [defaultFormValues]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <Grid item xs={12}>
      <ContentBox
        mainLabel={"Copper Mine"}
        label={
          accountProject?.project.ea_certificate &&
          `EAC #${accountProject?.project.ea_certificate}`
        }
      >
        <Box
          sx={{
            borderRadius: "4px",
            p: BCDesignTokens.layoutPaddingMedium,
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          }}
        >
          <CardInnerBox sx={{ pl: 0, pb: BCDesignTokens.layoutPaddingMedium }}>
            <Typography variant="h4" fontWeight={400}>
              Management Plans
            </Typography>
            <ProjectStatus status={PROJECT_STATUS.POST_DECISION} />
          </CardInnerBox>
          <Box
            sx={{
              p: BCDesignTokens.layoutPaddingMedium,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              borderRadius: "4px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              gap: BCDesignTokens.layoutPaddingLarge,
            }}
          >
            <BarTitle
              title={accountProject.project.name + " Management Plan"}
            />
            <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
              {/* <FormFieldSection formData={defaultFormValues} /> */}
              {/* <ActionButtons saveAndClose={saveAndClose} /> */}
            </Grid>
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
};
