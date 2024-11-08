import { ContentBox } from "@/components/Shared/ContentBox";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import * as yup from "yup";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
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
import ControlledRadioGroup from "@/components/Shared/controlled/ControlledRadioGroup";
import { useDocumentUploadStore } from "@/store/documentUploadStore";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { YesNoRadioOptions } from "@/components/Shared/YesNoRadioOptions";
import {
  SUBMISSION_STATUS,
  SUBMISSION_TYPE,
  SubmissionStatus,
} from "@/models/Submission";
import CloseIcon from "@mui/icons-material/Close";
import { When } from "react-if";
import { booleanToString, stringToBoolean } from "@/utils";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";

const consultationRecordSchema = yup.object().shape({
  consultedParties: yup.array().of(
    yup.object().shape({
      consultedParty: yup.string(),
    })
  ),
  allPartiesConsulted: yup.string().required("Please answer this question."),
  planWasReviewed: yup.string().required("Please answer this question."),
  writtenExplanationsProvidedToParties: yup
    .string()
    .required("Please answer this question."),
  writtenExplanationsProvidedToCommenters: yup
    .string()
    .required("Please answer this question."),
  consultationRecords: yup
    .array()
    .of(yup.string())
    .required("Please upload at least one document.")
    .min(1, "Please upload at least one document."),
});

type ConsultationRecordForm = yup.InferType<typeof consultationRecordSchema>;
export const ConsultationRecord = () => {
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

  const documentSubmissions = submissionItem?.submissions?.filter(
    (submission) => submission.type === SUBMISSION_TYPE.DOCUMENT
  );
  const defaultDocumentValues = useMemo(() => {
    if (!documentSubmissions) return {};

    return {
      consultationRecords: documentSubmissions.map(
        (submission) => submission.submitted_document.url
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
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "consultedParties", // this should match the field name in the schema
  });

  const handleAddParty = () => {
    append({ consultedParty: "" }); // append a new field for consultedParty
  };

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
    status: SubmissionStatus
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
            writtenExplanationsProvidedToParties
          ),
          writtenExplanationsProvidedToCommenters: stringToBoolean(
            writtenExplanationsProvidedToCommenters
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
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      fontWeight={400}
                      sx={{ color: BCDesignTokens.typographyColorDisabled }}
                    >
                      Consultation Records Information
                    </Typography>
                    <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
                  </Grid>
                  <Grid item xs={12} container>
                    <Grid
                      item
                      container
                      xs={12}
                      spacing={BCDesignTokens.layoutMarginSmall}
                    >
                      <Grid item xs={12}>
                        <Typography
                          variant="body1"
                          fontWeight={BCDesignTokens.typographyFontWeightsBold}
                        >
                          Names of consulted/engaged parties
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          These parties have been identified as requiring
                          consultation. Please include any additional parties
                          that have been consulted while developing this
                          Management Plan.
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        <ul
                          style={{
                            marginLeft: BCDesignTokens.layoutMarginSmall,
                            paddingLeft: BCDesignTokens.layoutPaddingSmall,
                          }}
                        >
                          <li>Ho’rem</li>
                          <li>Nustuk</li>
                          <li>Langkuem</li>
                          <li>Miskuuck</li>
                        </ul>
                      </Typography>
                      <Grid item container xs={12} spacing={2}>
                        {fields.map((field, index) => (
                          <Grid item container xs={12} key={field.id}>
                            <Grid item xs={6}>
                              <ControlledTextField
                                fullWidth
                                name={`consultedParties.${index}.consultedParty`}
                                placeholder="Enter the name of other consulted party here"
                                sx={{
                                  mb: 0,
                                }}
                              />
                            </Grid>
                            <When condition={fields.length > 1}>
                              <IconButton onClick={() => remove(index)}>
                                <CloseIcon />
                              </IconButton>
                            </When>
                          </Grid>
                        ))}
                      </Grid>
                      <Typography
                        variant="body1"
                        sx={{
                          color: BCDesignTokens.typographyColorLink,
                          cursor: "pointer",
                        }}
                        onClick={handleAddParty}
                      >
                        + Add a Consulted Party
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        Ensure that comment trackers clearly demonstrate that
                        consulted parties have had the opportunity to respond to
                        holder responses to the consulted parties comments.
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        Were all parties listed above consulted/engaged on the
                        development of this plan?
                      </Typography>
                      <ControlledRadioGroup name="allPartiesConsulted">
                        <YesNoRadioOptions
                          error={Boolean(errors["allPartiesConsulted"])}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        Was the plan provided to all parties listed above for
                        review and comment during plan development?
                      </Typography>
                      <ControlledRadioGroup name="planWasReviewed">
                        <YesNoRadioOptions
                          error={Boolean(errors["planWasReviewed"])}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        Have written explanations been provided to each party
                        listed above on how comments were fully and impartially
                        considered and addressed in the plan?
                      </Typography>
                      <ControlledRadioGroup name="writtenExplanationsProvidedToParties">
                        <YesNoRadioOptions
                          error={Boolean(
                            errors["writtenExplanationsProvidedToParties"]
                          )}
                        />
                      </ControlledRadioGroup>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sx={{ mb: BCDesignTokens.layoutMarginMedium }}
                    >
                      <Typography variant="body1">
                        For comments not addressed in this plan, have written
                        explanations been provided to the commenters as to why
                        the comments were not addressed?
                      </Typography>
                      <ControlledRadioGroup name="writtenExplanationsProvidedToCommenters">
                        <YesNoRadioOptions
                          error={Boolean(
                            errors["writtenExplanationsProvidedToCommenters"]
                          )}
                        />
                      </ControlledRadioGroup>
                    </Grid>
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
