import { ContentBox } from "@/components/Shared/ContentBox";
import { Box, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { CardInnerBox } from "@/components/Projects/Project";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import { DocumentUploadSection } from "./DocumentUploadSection";
import {
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
  SubmissionStatus,
} from "@/models/Submission";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import FormFieldSection from "./FormFieldSection";
import ActionButtons from "./ActionButtons";
import { consultationRecordSchema, ConsultationRecordForm } from "../constants";

export const ConsultationRecordProponentView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/proponent/_proponentLayout/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const { setIsOpen } = useLoaderBackdrop();
  const navigate = useNavigate();
  const { reset } = useDocumentUploadStore();

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    "item",
    Number(submissionItemId),
  ]);

  const formSubmission = submissionItem?.submissions?.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
  );
  const defaultFormValues = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      allPartiesConsulted: booleanToString(
        formSubmission.submitted_form.submission_json.allPartiesConsulted,
      ),
      planWasReviewed: booleanToString(
        formSubmission.submitted_form.submission_json.planWasReviewed,
      ),
      writtenExplanationsProvidedToParties: booleanToString(
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToParties,
      ),
      writtenExplanationsProvidedToCommenters: booleanToString(
        formSubmission.submitted_form.submission_json
          .writtenExplanationsProvidedToCommenters,
      ),
    };
  }, [formSubmission]);

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );
  const defaultDocumentValues = useMemo(() => {
    if (!documentSubmissions) return {};

    return {
      consultationRecords: documentSubmissions.map(
        (submission) => submission.submitted_document.url,
      ),
    };
  }, [documentSubmissions]);

  const methods = useForm<ConsultationRecordForm>({
    resolver: yupResolver(consultationRecordSchema),
    mode: "onSubmit",
    defaultValues: {
      consultedParties: [{ consultedParty: "" }],
      ...defaultFormValues,
      ...defaultDocumentValues,
    },
  });

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const onCreateFailure = () => {
    notify.error("Failed to save submission");
  };

  const onCreateSuccess = () => {
    notify.success("Submission saved successfully");

    navigate({
      to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };
  const { mutate: callSaveSubmission, isPending: isCreatingSubmissionPending } =
    useSaveSubmission({
      accountProjectId,
      submissionItem,
      options: {
        onSuccess: onCreateSuccess,
        onError: onCreateFailure,
      },
    });
  const {
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  const handleCompleteForm = (formData: ConsultationRecordForm) => {
    saveSubmission(formData, SUBMISSION_STATUS.COMPLETED.value); // Add default status here
  };

  const saveSubmission = async (
    formData: ConsultationRecordForm,
    status: SubmissionStatus,
  ) => {
    const {
      consultedParties,
      allPartiesConsulted,
      planWasReviewed,
      writtenExplanationsProvidedToParties,
      writtenExplanationsProvidedToCommenters,
    } = formData;
    callSaveSubmission({
      data: {
        type: SUBMISSION_TYPE.FORM,
        status,
        item_id: submissionItemId,
        data: {
          consultedParties,
          allPartiesConsulted: stringToBoolean(allPartiesConsulted),
          planWasReviewed: stringToBoolean(planWasReviewed),
          writtenExplanationsProvidedToParties: stringToBoolean(
            writtenExplanationsProvidedToParties,
          ),
          writtenExplanationsProvidedToCommenters: stringToBoolean(
            writtenExplanationsProvidedToCommenters,
          ),
        },
      },
    });
  };

  const saveAndClose = () => {
    if (!Object.keys(dirtyFields).length) {
      navigate({
        to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
      return;
    }
    const formData = {
      ...methods.getValues(),
    };

    saveSubmission(formData, SUBMISSION_STATUS.PARTIALLY_COMPLETED.value);
  };

  useEffect(() => {
    setIsOpen(isCreatingSubmissionPending);
    return () => setIsOpen(false);
  }, [isCreatingSubmissionPending, setIsOpen]);

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
            <FormProvider {...methods}>
              <Form onSubmit={handleSubmit(handleCompleteForm)}>
                <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
                  <FormFieldSection errors={errors} methods={methods} />
                  <Grid item xs={12}>
                    <DocumentUploadSection />
                  </Grid>
                  <ActionButtons saveAndClose={saveAndClose} />
                </Grid>
              </Form>
            </FormProvider>
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
};
