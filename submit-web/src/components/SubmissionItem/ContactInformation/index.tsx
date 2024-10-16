import { ContentBox } from "@/components/Shared/ContentBox";
import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import ControlledInputMask from "@/components/Shared/controlled/ControlledInputMask";
import BarTitle from "@/components/Shared/Text/BarTitle";
import { CardInnerBox } from "@/components/Projects/Project";
import { ProjectStatus } from "@/components/registration/addProjects/ProjectStatus";
import { PROJECT_STATUS } from "@/components/registration/addProjects/ProjectCard/constants";
import { useGetProject } from "@/hooks/api/useProjects";
import { useGetSubmissionItem } from "@/hooks/api/useItems";
import Form from "@/components/Shared/Forms/common";

const contactInformationSchema = yup.object().shape({
  primaryContact: yup.object().shape({
    givenName: yup.string().required("Please enter given name."),
    surname: yup.string().required("Please enter surname."),
    position: yup.string().required("Please enter position."),
    company: yup.string().required("Please enter company."),
    workPhoneNumber: yup.string().required("Please enter work phone number."),
    workEmailAddress: yup
      .string()
      .email("Invalid email")
      .required("Please enter work email."),
  }),
  secondaryContact: yup.object().shape({
    givenName: yup.string().required("Please enter given name."),
    surname: yup.string().required("Please enter surname."),
    position: yup.string().required("Please enter position."),
    company: yup.string().required("Please enter company."),
    workPhoneNumber: yup.string().required("Please enter work phone number."),
    workEmailAddress: yup
      .string()
      .email("Invalid email")
      .required("Please enter work email."),
  }),
});

type ContactInformationForm = yup.InferType<typeof contactInformationSchema>;
export const ContactInformation = () => {
  const {
    projectId: projectIdParam,
    submissionPackageId,
    submissionId,
  } = useParams({
    from: "/_authenticated/_dashboard/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });
  const { data: submissionItem } = useGetSubmissionItem({
    itemId: Number(submissionId),
  });
  const projectId = Number(projectIdParam);
  const { data: accountProject } = useGetProject({
    projectId,
  });

  const { setIsOpen } = useLoaderBackdrop();
  const navigate = useNavigate();

  const formSubmission = submissionItem?.submissions.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM
  );
  const defaultValues = useMemo(() => {
    if (!formSubmission?.submitted_form?.submission_json) return {};
    return formSubmission.submitted_form.submission_json;
  }, [formSubmission]);
  const methods = useForm<ContactInformationForm>({
    resolver: yupResolver(contactInformationSchema),
    mode: "onSubmit",
    defaultValues,
  });

  const { handleSubmit } = methods;

  const onCreateFailure = () => {
    notify.error("Failed to create submission");
  };

  const onCreateSuccess = () => {
    notify.success("Submission created successfully");
    navigate({
      to: `/projects/${projectId}/submission-packages/${submissionPackageId}`,
    });
  };
  const { mutate: saveSubmission, isPending: isCreatingSubmissionPending } =
    useSaveSubmission(submissionItem, {
      onError: onCreateFailure,
      onSuccess: onCreateSuccess,
    });

  const onSubmitHandler = async (formData: ContactInformationForm) => {
    if (!submissionItem) {
      notify.error("Failed to load submission item");
      return;
    }
    const request = {
      type: SUBMISSION_TYPE.FORM,
      data: formData,
      status: SUBMISSION_STATUS.COMPLETED.value,
      item_id: submissionItem.id,
    };
    saveSubmission({
      data: request,
    });
  };

  useEffect(() => {
    setIsOpen(isCreatingSubmissionPending);
    return () => setIsOpen(false);
  }, [isCreatingSubmissionPending, setIsOpen]);

  const handleCancel = () => {
    navigate({
      to: `/projects/${projectId}/submission-packages/${submissionPackageId}`,
    });
  };

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <Grid item xs={12}>
      <ContentBox mainLabel={"Copper Mine"}>
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
              <Form onSubmit={handleSubmit(onSubmitHandler)}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      fontWeight={400}
                      sx={{ color: BCDesignTokens.typographyColorDisabled }}
                    >
                      Contact Information
                    </Typography>
                    <Divider sx={{ mt: BCDesignTokens.layoutMarginXsmall }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      Primary Contact
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    container
                    sx={{
                      width: {
                        xs: "100%", // width for extra-small screens
                        md: "390px", // width for medium screens and up
                      },
                    }}
                  >
                    <Grid item xs={12}>
                      <ControlledTextField
                        name="primaryContact.givenName"
                        label="Given Name"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ControlledTextField
                        name="primaryContact.surname"
                        label="Surname"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ControlledTextField
                        name="primaryContact.company"
                        label="Company"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ControlledTextField
                        name="primaryContact.position"
                        label="Position/Role"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ControlledInputMask
                        name="primaryContact.workPhoneNumber"
                        mask="(999) 999-9999"
                        label="Work Phone Number"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ControlledTextField
                        name="primaryContact.workEmailAddress"
                        label="Work Email Address"
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "bold",
                      }}
                    >
                      Secondary Contact
                    </Typography>
                  </Grid>
                  <Grid item md={4} xs={12} container>
                    <Grid
                      container
                      sx={{
                        width: {
                          xs: "100%", // width for extra-small screens
                          md: "390px", // width for medium screens and up
                        },
                      }}
                    >
                      <Grid item xs={12}>
                        <ControlledTextField
                          name="secondaryContact.givenName"
                          label="Given Name"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ControlledTextField
                          name="secondaryContact.surname"
                          label="Surname"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ControlledTextField
                          name="secondaryContact.company"
                          label="Company"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ControlledTextField
                          name="secondaryContact.position"
                          label="Position/Role"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ControlledInputMask
                          name="secondaryContact.workPhoneNumber"
                          mask="(999) 999-9999"
                          label="Work Phone Number"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <ControlledTextField
                          name="secondaryContact.workEmailAddress"
                          label="Work Email Address"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} container spacing={2}>
                    <Grid item xs={12} sm="auto">
                      <Button color="secondary" onClick={handleCancel}>
                        Close
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm="auto">
                      <Button type="submit">Save</Button>
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
