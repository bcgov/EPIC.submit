import { ContentBox } from "@/components/Shared/ContentBox";
import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import {
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
  SubmissionStatus,
} from "@/models/Submission";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import { CardInnerBox } from "@/components/Projects/Project";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import BarTitle from "@/components/Shared/Text/BarTitle";
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import { MANAGEMENT_PLAN_DOCUMENT_FOLDERS } from "./constants";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { QUERY_KEY } from "@/hooks/api/constants";

const managementPlanSubmissionSchema = yup.object().shape({
  conditionSatisfied: yup.string().required("Please answer this question."),
  allRequirementsAddressed: yup
    .string()
    .required("Please answer this question."),
  requirementsClear: yup.string().required("Please answer this question."),
  informationAccurate: yup.string().required("Please answer this question."),
  managementPlans: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
  supportingDocuments: yup.array().of(yup.string()),
});

type ManagementPlanSubmissionForm = yup.InferType<
  typeof managementPlanSubmissionSchema
>;
export const ManagementPlanSubmission = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId: submissionItemId,
  } = useParams({
    from: "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
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
    (submission) => submission.type === SUBMISSION_TYPE.FORM
  );
  const defaultFormValues = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};

    return {
      ...formSubmission.submitted_form.submission_json,
      conditionSatisfied: booleanToString(
        formSubmission.submitted_form.submission_json.conditionSatisfied
      ),
      allRequirementsAddressed: booleanToString(
        formSubmission.submitted_form.submission_json.allRequirementsAddressed
      ),
      requirementsClear: booleanToString(
        formSubmission.submitted_form.submission_json.requirementsClear
      ),
      informationAccurate: booleanToString(
        formSubmission.submitted_form.submission_json.informationAccurate
      ),
    };
  }, [formSubmission]);

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT
  );
  const defaultDocumentValues = useMemo(() => {
    if (!documentSubmissions) return {};

    return {
      managementPlans: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document.folder ===
            MANAGEMENT_PLAN_DOCUMENT_FOLDERS.MANAGEMENT_PLAN
        )
        .map((submission) => submission.submitted_document.url),
      supportingDocuments: documentSubmissions
        .filter(
          (submission) =>
            submission.submitted_document.folder ===
            MANAGEMENT_PLAN_DOCUMENT_FOLDERS.SUPPORTING
        )
        .map((submission) => submission.submitted_document.url),
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

  const onCreateFailure = () => {
    notify.error("Failed to save submission");
  };

  const onCreateSuccess = () => {
    notify.success("Submission saved successfully");
    navigate({
      to: `/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
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

  const handleCompleteForm = (formData: ManagementPlanSubmissionForm) => {
    saveSubmission(formData, SUBMISSION_STATUS.COMPLETED.value); // Add default status here
  };

  const saveSubmission = async (
    formData: ManagementPlanSubmissionForm,
    status: SubmissionStatus
  ) => {
    const {
      conditionSatisfied,
      allRequirementsAddressed,
      requirementsClear,
      informationAccurate,
    } = formData;
    callSaveSubmission({
      data: {
        type: SUBMISSION_TYPE.FORM,
        status,
        item_id: submissionItemId,
        data: {
          conditionSatisfied: stringToBoolean(conditionSatisfied),
          allRequirementsAddressed: stringToBoolean(allRequirementsAddressed),
          requirementsClear: stringToBoolean(requirementsClear),
          informationAccurate: stringToBoolean(informationAccurate),
        },
      },
    });
  };

  const saveAndClose = () => {
    if (!Object.keys(dirtyFields).length) {
      navigate({
        to: `/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
      return;
    }
    const formData = {
      ...methods.getValues(),
    };

    saveSubmission(formData, SUBMISSION_STATUS.PARTIALLY_COMPLETED.value);
  };

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <Grid item xs={12}>
      <ContentBox
        mainLabel={"Copper Mine"}
        label={`EAC #${accountProject?.project.ea_certificate}`}
      >
        <Box
          sx={{
            borderRadius: "4px",
            p: BCDesignTokens.layoutPaddingMedium,
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          }}
        >
          <CardInnerBox sx={{ pl: 0, pb: BCDesignTokens.layoutPaddingMedium }}>
            <Typography variant="h4" fontWeight={700}>
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
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      fontWeight={400}
                      sx={{ color: BCDesignTokens.typographyColorDisabled }}
                    >
                      Management Plan Requirements
                    </Typography>
                    <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
                  </Grid>
                  <Grid item xs={12} container>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        Does the plan address all the requirements in the
                        (condition number)?
                      </Typography>

                      <ControlledRadioGroup name="conditionSatisfied">
                        <YesNoRadioOptions
                          error={Boolean(errors["conditionSatisfied"])}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        If the condition(s) associated with the plan reference
                        other documents, in whole or part (e.g., project
                        application sections), does the plan address all
                        requirements within the referenced document(s)?
                      </Typography>
                      <ControlledRadioGroup name="allRequirementsAddressed">
                        <YesNoRadioOptions
                          error={Boolean(errors["allRequirementsAddressed"])}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        Is each requirement in the plan clear, measurable,
                        and/or include accountability?
                      </Typography>
                      <ControlledRadioGroup name="requirementsClear">
                        <YesNoRadioOptions
                          error={Boolean(errors["requirementsClear"])}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      fontWeight={400}
                      sx={{ color: BCDesignTokens.typographyColorDisabled }}
                    >
                      Information Verification
                    </Typography>
                    <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      The information on this form is correct to the best of
                      your knowledge.
                    </Typography>
                    <ControlledRadioGroup name="informationAccurate">
                      <YesNoRadioOptions
                        error={Boolean(errors["informationAccurate"])}
                      />
                    </ControlledRadioGroup>
                  </Grid>
                  <Grid item xs={12}>
                    <DocumentUploadSection />
                  </Grid>
                  <Grid item xs={12} container spacing={2}>
                    <Grid item xs={12} sm="auto">
                      <Button color="secondary" onClick={saveAndClose}>
                        Save & Continue Later
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm="auto">
                      <Button type="submit">Save Completed Form</Button>
                    </Grid>
                  </Grid>
                </Grid>
              </Form>
            </FormProvider>
          </Box>
        </Box>
      </ContentBox>
    </Grid>
  );
};
