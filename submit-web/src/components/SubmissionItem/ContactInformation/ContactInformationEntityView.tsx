import { Button, Grid, Typography } from "@mui/material";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useEffect, useMemo } from "react";
import { useLoaderBackdrop } from "@/components/Shared/Overlays/loaderBackdropStore";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_ITEM_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import ControlledInputMask from "@/components/Shared/controlled/ControlledInputMask";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SubmissionFormContainer } from "../SubmissionFormContainer";
import { QUERY_KEY } from "@/hooks/api/constants";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";

const contactInformationSchema = yup.object().shape({
  primaryContact: yup.object().shape({
    givenName: yup.string().required("Please enter a given name."),
    surname: yup.string().required("Please enter a surname."),
    position: yup.string().required("Please enter a position/role."),
    company: yup.string().required("Please enter a company."),
    extensionNumber: yup.string(),
    workPhoneNumber: yup
      .string()
      .required("Please enter a phone number in this format: (xxx) xxx-xxxx."),
    workEmailAddress: yup
      .string()
      .email("Invalid email")
      .required("Please enter a valid email address."),
  }),
  secondaryContact: yup.object().shape({
    givenName: yup.string().required("Please enter a given name."),
    surname: yup.string().required("Please enter a surname."),
    position: yup.string().required("Please enter a position/role."),
    company: yup.string().required("Please enter a company."),
    extensionNumber: yup.string(),
    workPhoneNumber: yup
      .string()
      .required("Please enter a phone number in this format: (xxx) xxx-xxxx."),
    workEmailAddress: yup
      .string()
      .email("Invalid email")
      .required("Please enter a valid email address."),
  }),
});

type ContactInformationForm = yup.InferType<typeof contactInformationSchema>;

export const ContactInformationEntityView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId,
  } = useParams({
    strict: false,
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionId),
  ]);
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProject({
    accountProjectId,
  });

  const { data: packageData } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const isSubmitted = packageData?.submitted_on;

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
      to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };
  const { mutate: saveSubmission, isPending: isCreatingSubmissionPending } =
    useSaveSubmission({
      accountProjectId,
      submissionItem,
      options: {
        onSuccess: onCreateSuccess,
        onError: onCreateFailure,
      },
    });

  const onSubmitHandler = async (formData: ContactInformationForm) => {
    if (!submissionItem) {
      notify.error("Failed to load submission item");
      return;
    }
    const request = {
      type: SUBMISSION_TYPE.FORM,
      data: formData,
      status: isSubmitted ? undefined : SUBMISSION_ITEM_STATUS.COMPLETED.value,
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
      to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(onSubmitHandler)} methods={methods}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <BarBlueTitle title="Contact Information" />
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
                  label="Company Name"
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
              <Grid item xs={12} container spacing={1}>
                <Grid item xs={8}>
                  <ControlledInputMask
                    name="primaryContact.workPhoneNumber"
                    mask="(999) 999-9999"
                    label="Work Phone Number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <ControlledInputMask
                    name="primaryContact.extensionNumber"
                    mask="9999"
                    label="Ext."
                    fullWidth
                  />
                </Grid>
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
                    label="Company Name"
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
                <Grid item xs={12} container spacing={1}>
                  <Grid item xs={8}>
                    <ControlledInputMask
                      name="secondaryContact.workPhoneNumber"
                      mask="(999) 999-9999"
                      label="Work Phone Number"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <ControlledInputMask
                      name="secondaryContact.extensionNumber"
                      mask="9999"
                      label="Ext."
                      fullWidth
                    />
                  </Grid>
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
    </SubmissionFormContainer>
  );
};
