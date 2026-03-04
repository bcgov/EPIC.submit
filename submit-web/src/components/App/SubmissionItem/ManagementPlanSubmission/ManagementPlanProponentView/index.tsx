import { Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_TYPE,
  SubmissionItemStatus,
} from "@/models/Submission";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import {
  ManagementPlanSubmissionForm,
  managementPlanSubmissionSchema,
} from "./constants";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { QUERY_KEY } from "@/hooks/api/constants";
import FormFieldSection from "./FormFieldSection";
import ActionButtons from "./ActionButtons";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";
import { isAxiosError } from "axios";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import {
  GenericDocumentUploadSection,
  UploadSectionConfig,
} from "@/components/App/DocumentUpload/GenericDocumentUploadSection";

export const ManagementPlanSubmissionProponentView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const [isBackdropOpen, setIsBackdropOpen] = useState(false);
  const navigate = useNavigate();

  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionItemId),
  ]);

  const documentUploadSections: UploadSectionConfig[] = [
    {
      name: "managementPlans",
      label: "Management Plan/IEM Terms of Engagement",
      folder: S3_FOLDER.MANAGEMENT_PLANS.value,
      maxFiles: 1,
      maxFilesErrorMessage:
        "You can only submit one Management Plan/IEM Terms of Engagement per submission. Please add supporting documents in the section below.",
    },
    {
      name: "supportingDocuments",
      label: "Supporting Documents",
      folder: S3_FOLDER.SUPPORTING_DOCUMENTS.value,
      description: "e.g. table of proposed changes, table of concordance",
    },
  ];

  const formSubmission = submissionItem?.submissions.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
  );
  const defaultFormValues = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      conditionSatisfied: booleanToString(
        formSubmission.submitted_form.submission_json.conditionSatisfied,
      ),
      allRequirementsAddressed: booleanToString(
        formSubmission.submitted_form.submission_json.allRequirementsAddressed,
      ),
      informationAccurate: booleanToString(
        formSubmission.submitted_form.submission_json.informationAccurate,
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
      managementPlans: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document?.folder ===
            S3_FOLDER.MANAGEMENT_PLANS.value,
        )
        .map((submission) => submission.submitted_document?.url),
      supportingDocuments: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document?.folder ===
            S3_FOLDER.SUPPORTING_DOCUMENTS.value,
        )
        .map((submission) => submission.submitted_document?.url),
    };
  }, [documentSubmissions]);

  const methods = useForm<ManagementPlanSubmissionForm>({
    resolver: yupResolver(managementPlanSubmissionSchema),
    mode: "onSubmit",
    defaultValues: {
      ...defaultFormValues,
      ...defaultDocumentValues,
    },
  });

  const {
    handleSubmit,
    formState: { errors, dirtyFields },
  } = methods;

  const { refetch } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const { mutateAsync: callSaveSubmission } = useSaveSubmission({
    accountProjectId,
    submissionItem,
  });

  const handleCompleteForm = (formData: ManagementPlanSubmissionForm) => {
    saveSubmission(formData, SUBMISSION_ITEM_STATUS.COMPLETED.value); // Add default status here
  };
  const saveSubmission = async (
    formData: ManagementPlanSubmissionForm,
    status: SubmissionItemStatus,
  ) => {
    try {
      const {
        conditionSatisfied,
        allRequirementsAddressed,
        informationAccurate,
        notes,
      } = formData;
      setIsBackdropOpen(true);
      await callSaveSubmission({
        data: {
          type: SUBMISSION_TYPE.FORM,
          status,
          item_id: submissionItemId,
          data: {
            conditionSatisfied: stringToBoolean(conditionSatisfied),
            allRequirementsAddressed: stringToBoolean(allRequirementsAddressed),
            informationAccurate: stringToBoolean(informationAccurate),
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
      const errorMessage =
        isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to save submission";
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
  return (
    <SubmissionFormContainer>
      <SubmitLoaderBackdrop isOpen={isBackdropOpen} />
      <FormProvider {...methods}>
        <Form methods={methods}>
          <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
            <Grid item xs={12}>
              <BarBlueTitle title="Management Plan Requirements" />
            </Grid>
            <Grid item xs={12}>
              <FormFieldSection errors={errors} />
              <GenericDocumentUploadSection sections={documentUploadSections} />
            </Grid>
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
