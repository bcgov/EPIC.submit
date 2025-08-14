import { Grid } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import {
  SUBMISSION_ITEM_STATUS,
  SUBMISSION_TYPE,
  SubmissionItemStatus,
} from "@/models/Submission";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { IemSubmissionForm, iemSubmissionSchema } from "./constants";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { QUERY_KEY } from "@/hooks/api/constants";
import FormFieldSection from "./FormFieldSection";
import ActionButtons from "./ActionButtons";
import { SubmissionFormContainer } from "../../SubmissionFormContainer";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { S3_FOLDER } from "@/hooks/api/useObjectStorage";

export const IemSubmissionProponentView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/proponent/_proponentLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const { setIsOpen } = useLoaderBackdrop();
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
      iems: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document?.folder === S3_FOLDER.IEMS.value,
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

  const methods = useForm<IemSubmissionForm>({
    resolver: yupResolver(iemSubmissionSchema),
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

  useEffect(() => {
    setIsOpen(isCreatingSubmissionPending);
    return () => setIsOpen(false);
  }, [isCreatingSubmissionPending, setIsOpen]);

  const handleCompleteForm = (formData: IemSubmissionForm) => {
    saveSubmission(formData, SUBMISSION_ITEM_STATUS.COMPLETED.value); // Add default status here
  };

  const saveSubmission = async (
    formData: IemSubmissionForm,
    status: SubmissionItemStatus,
  ) => {
    const {
      conditionSatisfied,
      allRequirementsAddressed,
      informationAccurate,
      notes,
    } = formData;
    callSaveSubmission({
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
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(handleCompleteForm)} methods={methods}>
          <Grid container spacing={BCDesignTokens.layoutMarginMedium}>
            <Grid item xs={12}>
              <BarBlueTitle title="Independent Environmental Monitor Terms of Engagement Requirements" />
            </Grid>
            <Grid item xs={12}>
              <FormFieldSection errors={errors} />
              <DocumentUploadSection />
            </Grid>
            <ActionButtons saveAndClose={saveAndClose} />
          </Grid>
        </Form>
      </FormProvider>
    </SubmissionFormContainer>
  );
};
