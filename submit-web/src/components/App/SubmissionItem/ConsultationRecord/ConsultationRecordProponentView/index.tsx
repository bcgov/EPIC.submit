import { Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { useGetAccountProject } from "@/hooks/api/useProjects";
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
import {
  consultationRecordSchema,
  ConsultationRecordForm,
} from "@/components/App/SubmissionItem/ConsultationRecord/constants";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import {
  getSubmissionPackageQueryOptions,
  useGetSubmissionPackage,
} from "@/hooks/api/usePackages";
import { SubmissionPackage } from "@/models/Package";
import UpdateRequestWidget from "@/components/App/Submission/UpdateRequestWidget";
import { isAxiosError } from "axios";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";

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

  const [isBackdropOpen, setIsBackdropOpen] = useState(false);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    "item",
    Number(submissionItemId),
  ]);

  const submissionPackage = queryClient.getQueryData<SubmissionPackage>(
    getSubmissionPackageQueryOptions({
      packageId: Number(submissionPackageId),
    }).queryKey,
  );

  const partiesList = useMemo(() => {
    const parties =
      submissionPackage?.meta?.main_condition?.condition_attributes
        ?.parties_required_to_be_consulted;
    if (!parties) return [];

    if (parties instanceof String) {
      return parties.split(",");
    }

    if (Array.isArray(parties)) {
      return parties;
    }

    return [];
  }, [submissionPackage]);

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
      notes: formSubmission.submitted_form.submission_json.notes,
    };
  }, [formSubmission]);

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT,
  );
  const defaultDocumentValues = useMemo(() => {
    if (!documentSubmissions) return {};

    return {
      consultationRecords: documentSubmissions.map(
        (submission) => submission.submitted_document?.url,
      ),
    };
  }, [documentSubmissions]);

  const methods = useForm<ConsultationRecordForm>({
    resolver: yupResolver(consultationRecordSchema),
    mode: "onSubmit",
    defaultValues: {
      consultedParties: [],
      ...defaultFormValues,
      ...defaultDocumentValues,
    },
  });

  const { refetch } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const { mutateAsync: callSaveSubmission } = useSaveSubmission({
    accountProjectId,
    submissionItem,
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
      notes,
    } = formData;
    setIsBackdropOpen(true);
    try {
      await callSaveSubmission({
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
            notes,
          },
        },
      });
      await refetch();
      notify.success("Submission saved successfully");
      navigate({
        to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
    } catch (error) {
      let errorMessage = "Failed to save submission";
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      notify.error(errorMessage);
    } finally {
      setIsBackdropOpen(false);
    }
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

  if (!accountProject) return <Navigate to="/error" />;
  if (!submissionPackage) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <SubmitLoaderBackdrop isOpen={isBackdropOpen} />
      <FormProvider {...methods}>
        <Form methods={methods}>
          <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
            <FormFieldSection
              packageType={submissionPackage.type.name}
              errors={errors}
              methods={methods}
              partiesList={partiesList}
            />
            <Grid item xs={12}>
              <DocumentUploadSection />
            </Grid>
            {submissionPackage &&
              submissionPackage?.update_requests?.length > 0 && (
                <Grid item xs={12}>
                  <UpdateRequestWidget submissionPackage={submissionPackage} />
                </Grid>
              )}
            <ActionButtons
              onSubmit={handleSubmit(handleCompleteForm)}
              saveAndClose={saveAndClose}
            />
          </Grid>
        </Form>
      </FormProvider>
    </SubmissionFormContainer>
  );
};
