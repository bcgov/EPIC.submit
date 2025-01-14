import { Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { useObjectUploadStore } from "@/store/documentUploadStore";
import { DocumentUploadSection } from "./DocumentUploadSection";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_TYPE,
  SubmissionItemStatus,
} from "@/models/Submission";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import FormFieldSection from "./FormFieldSection";
import ActionButtons from "./ActionButtons";
import { consultationRecordSchema, ConsultationRecordForm } from "../constants";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";

export const ConsultationRecordProponentView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const { setIsOpen } = useLoaderBackdrop();
  const navigate = useNavigate();
  const { reset } = useObjectUploadStore();

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
    saveSubmission(formData, SUBMISSION_ITEM_STATUS.COMPLETED.value); // Add default status here
  };

  const saveSubmission = async (
    formData: ConsultationRecordForm,
    status: SubmissionItemStatus,
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

    saveSubmission(formData, SUBMISSION_ITEM_STATUS.PARTIALLY_COMPLETED.value);
  };

  useEffect(() => {
    setIsOpen(isCreatingSubmissionPending);
    return () => setIsOpen(false);
  }, [isCreatingSubmissionPending, setIsOpen]);

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
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
    </SubmissionFormContainer>
  );
};
