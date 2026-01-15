import { Button, Grid, Typography } from "@mui/material";
import * as yup from "yup";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "@/components/Shared/controlled/ControlledTextField";
import ControlledSelect from "@/components/Shared/controlled/ControlledSelect";
import { useSaveSubmission } from "@/hooks/api/useSubmissions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useMemo, useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_ITEM_STATUS, SUBMISSION_TYPE } from "@/models/Submission";
import { useGetAccountProject } from "@/hooks/api/useProjects";
import Form from "@/components/Shared/Forms/common";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SubmissionFormContainer } from "../SubmissionFormContainer";
import { QUERY_KEY } from "@/hooks/api/constants";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { useGetSubmissionPackage } from "@/hooks/api/usePackages";
import { validatePhoneNumber } from "./utils";
import { isAxiosError } from "axios";
import { SubmitLoaderBackdrop } from "@/components/Shared/Overlays/SubmitLoaderBackdrop";
import { useGetAccountUsers } from "@/hooks/api/useAccountUsers";

const contactInformationSchema = yup.object().shape({
  primaryContact: yup.object().shape({
    accountUserId: yup.string().nullable(),
    givenName: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a given name."),
      otherwise: (schema) => schema.notRequired(),
    }),
    surname: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a surname."),
      otherwise: (schema) => schema.notRequired(),
    }),
    position: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a position/role."),
      otherwise: (schema) => schema.notRequired(),
    }),
    company: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a company."),
      otherwise: (schema) => schema.notRequired(),
    }),
    extensionNumber: yup.string(),
    workPhoneNumber: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) =>
        schema
          .required(
            "Please enter a phone number in this format: (xxx) xxx-xxxx.",
          )
          .test(
            "phone-complete",
            "Please enter a complete phone number in this format: (xxx) xxx-xxxx.",
            validatePhoneNumber,
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    workEmailAddress: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) =>
        schema
          .email("Invalid email")
          .required("Please enter a valid email address."),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),
  secondaryContact: yup.object().shape({
    accountUserId: yup
      .string()
      .nullable()
      .test(
        "not-same-as-primary",
        "Secondary contact cannot be the same as primary contact.",
        function (value) {
          const root = this.from?.[1]?.value;
          const primaryUserId = root?.primaryContact?.accountUserId;
          if (!value || !primaryUserId) return true;
          return value !== primaryUserId;
        },
      ),
    givenName: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a given name."),
      otherwise: (schema) => schema.notRequired(),
    }),
    surname: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a surname."),
      otherwise: (schema) => schema.notRequired(),
    }),
    position: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a position/role."),
      otherwise: (schema) => schema.notRequired(),
    }),
    company: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) => schema.required("Please enter a company."),
      otherwise: (schema) => schema.notRequired(),
    }),
    extensionNumber: yup.string(),
    workPhoneNumber: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) =>
        schema
          .required(
            "Please enter a phone number in this format: (xxx) xxx-xxxx.",
          )
          .test(
            "phone-complete",
            "Please enter a complete phone number in this format: (xxx) xxx-xxxx.",
            validatePhoneNumber,
          ),
      otherwise: (schema) => schema.notRequired(),
    }),
    workEmailAddress: yup.string().when("accountUserId", {
      is: (val: number | null) => !val,
      then: (schema) =>
        schema
          .email("Invalid email")
          .required("Please enter a valid email address."),
      otherwise: (schema) => schema.notRequired(),
    }),
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

  const { data: accountUsers } = useGetAccountUsers({
    accountId: accountProject?.account_id,
  });

  const accountUserOptions = useMemo(() => {
    if (!accountUsers) return [];
    return accountUsers.map((user) => ({
      value: user.id ?? 0,
      label: user.full_name,
    }));
  }, [accountUsers]);

  const { data: packageData } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const isSubmitted = packageData?.submitted_on;

  const navigate = useNavigate();

  const formSubmission = submissionItem?.submissions.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
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

  const { handleSubmit, watch, clearErrors, setValue, trigger } = methods;

  const primaryContactUserId = watch("primaryContact.accountUserId");
  const secondaryContactUserId = watch("secondaryContact.accountUserId");
  const isPrimaryUserSelected = Boolean(primaryContactUserId);
  const isSecondaryUserSelected = Boolean(secondaryContactUserId);

  const prevPrimaryContactUserId = useRef(primaryContactUserId);
  const prevSecondaryContactUserId = useRef(secondaryContactUserId);

  useEffect(() => {
    if (primaryContactUserId && accountUsers) {
      const selectedUser = accountUsers.find(
        (user) => String(user.id) === String(primaryContactUserId),
      );
      if (selectedUser) {
        setValue("primaryContact.givenName", selectedUser.first_name ?? "");
        setValue("primaryContact.surname", selectedUser.last_name ?? "");
        setValue("primaryContact.position", selectedUser.position ?? "");
        setValue("primaryContact.company", selectedUser.company_name ?? "");
        setValue(
          "primaryContact.workPhoneNumber",
          selectedUser.work_contact_number ?? "",
        );
        setValue(
          "primaryContact.workEmailAddress",
          selectedUser.work_email_address ?? "",
        );
        clearErrors([
          "primaryContact.givenName",
          "primaryContact.surname",
          "primaryContact.position",
          "primaryContact.company",
          "primaryContact.workPhoneNumber",
          "primaryContact.workEmailAddress",
        ]);
      }
    } else if (!primaryContactUserId && prevPrimaryContactUserId.current) {
      setValue("primaryContact.givenName", "");
      setValue("primaryContact.surname", "");
      setValue("primaryContact.position", "");
      setValue("primaryContact.company", "");
      setValue("primaryContact.workPhoneNumber", "");
      setValue("primaryContact.workEmailAddress", "");
      setValue("primaryContact.extensionNumber", "");
    }
    prevPrimaryContactUserId.current = primaryContactUserId;
    if (secondaryContactUserId) {
      trigger("secondaryContact.accountUserId");
    }
  }, [primaryContactUserId, accountUsers, setValue, clearErrors, secondaryContactUserId, trigger]);

  useEffect(() => {
    if (secondaryContactUserId && accountUsers) {
      const selectedUser = accountUsers.find(
        (user) => String(user.id) === String(secondaryContactUserId),
      );
      if (selectedUser) {
        setValue("secondaryContact.givenName", selectedUser.first_name ?? "");
        setValue("secondaryContact.surname", selectedUser.last_name ?? "");
        setValue("secondaryContact.position", selectedUser.position ?? "");
        setValue("secondaryContact.company", selectedUser.company_name ?? "");
        setValue(
          "secondaryContact.workPhoneNumber",
          selectedUser.work_contact_number ?? "",
        );
        setValue(
          "secondaryContact.workEmailAddress",
          selectedUser.work_email_address ?? "",
        );
        clearErrors([
          "secondaryContact.givenName",
          "secondaryContact.surname",
          "secondaryContact.position",
          "secondaryContact.company",
          "secondaryContact.workPhoneNumber",
          "secondaryContact.workEmailAddress",
        ]);
      }
    } else if (!secondaryContactUserId && prevSecondaryContactUserId.current) {
      setValue("secondaryContact.givenName", "");
      setValue("secondaryContact.surname", "");
      setValue("secondaryContact.position", "");
      setValue("secondaryContact.company", "");
      setValue("secondaryContact.workPhoneNumber", "");
      setValue("secondaryContact.workEmailAddress", "");
      setValue("secondaryContact.extensionNumber", "");
    }
    prevSecondaryContactUserId.current = secondaryContactUserId;
    if (secondaryContactUserId && primaryContactUserId) {
      trigger("secondaryContact.accountUserId");
    }
  }, [secondaryContactUserId, accountUsers, setValue, clearErrors, primaryContactUserId, trigger]);

  const { refetch } = useGetSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  const {
    mutateAsync: saveSubmission,
    isPending: isCreatingSubmissionPending,
  } = useSaveSubmission({
    accountProjectId,
    submissionItem,
  });

  const onSubmitHandler = async (formData: ContactInformationForm) => {
    if (!submissionItem) {
      notify.error("Failed to load submission item");
      return;
    }

    const dataToSubmit = { ...formData };

    if (dataToSubmit.primaryContact?.accountUserId) {
      dataToSubmit.primaryContact = {
        accountUserId: dataToSubmit.primaryContact.accountUserId,
        givenName: "",
        surname: "",
        position: "",
        company: "",
        workPhoneNumber: "",
        workEmailAddress: "",
        extensionNumber: "",
      };
    }

    if (dataToSubmit.secondaryContact?.accountUserId) {
      dataToSubmit.secondaryContact = {
        accountUserId: dataToSubmit.secondaryContact.accountUserId,
        givenName: "",
        surname: "",
        position: "",
        company: "",
        workPhoneNumber: "",
        workEmailAddress: "",
        extensionNumber: "",
      };
    }

    const request = {
      type: SUBMISSION_TYPE.FORM,
      data: dataToSubmit,
      status: isSubmitted ? undefined : SUBMISSION_ITEM_STATUS.COMPLETED.value,
      item_id: submissionItem.id,
    };

    try {
      await saveSubmission({
        data: request,
      });
      await refetch();
      notify.success("Submission created successfully");
      navigate({
        to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
      });
    } catch (error) {
      let errorMessage = "Failed to create submission";
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      notify.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate({
      to: `/proponent/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <SubmitLoaderBackdrop isOpen={isCreatingSubmissionPending} />
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(onSubmitHandler)} methods={methods}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <BarBlueTitle title="Submission Contact Information" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1" lineHeight={"normal"}>
                Provide the contact details for the person(s) we should reach
                out to if we have questions about this submission package. You
                can select from your saved contacts or add new contact
                information below.
              </Typography>
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
                <ControlledSelect
                  name="primaryContact.accountUserId"
                  label="Add New Contact or Select Existing User"
                  options={accountUserOptions}
                  placeholder="Add New Contact"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <ControlledTextField
                  name="primaryContact.givenName"
                  label="Given Name"
                  fullWidth
                  disabled={isPrimaryUserSelected}
                />
              </Grid>
              <Grid item xs={12}>
                <ControlledTextField
                  name="primaryContact.surname"
                  label="Surname"
                  fullWidth
                  disabled={isPrimaryUserSelected}
                />
              </Grid>
              <Grid item xs={12}>
                <ControlledTextField
                  name="primaryContact.company"
                  label="Company Name"
                  fullWidth
                  disabled={isPrimaryUserSelected}
                />
              </Grid>
              <Grid item xs={12}>
                <ControlledTextField
                  name="primaryContact.position"
                  label="Position/Role"
                  fullWidth
                  disabled={isPrimaryUserSelected}
                />
              </Grid>
              <Grid item xs={12} container spacing={1}>
                <Grid item xs={8}>
                  <ControlledTextField
                    name="primaryContact.workPhoneNumber"
                    mask="(000) 000-0000"
                    label="Work Phone Number"
                    fullWidth
                    disabled={isPrimaryUserSelected}
                  />
                </Grid>
                <Grid item xs={4}>
                  <ControlledTextField
                    name="primaryContact.extensionNumber"
                    mask="0000"
                    label="Ext."
                    fullWidth
                    disabled={isPrimaryUserSelected}
                  />
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <ControlledTextField
                  name="primaryContact.workEmailAddress"
                  label="Work Email Address"
                  fullWidth
                  disabled={isPrimaryUserSelected}
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
                  <ControlledSelect
                    name="secondaryContact.accountUserId"
                    label="Add New Contact or Select Existing User"
                    options={accountUserOptions}
                    placeholder="Add New Contact"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="secondaryContact.givenName"
                    label="Given Name"
                    fullWidth
                    disabled={isSecondaryUserSelected}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="secondaryContact.surname"
                    label="Surname"
                    fullWidth
                    disabled={isSecondaryUserSelected}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="secondaryContact.company"
                    label="Company Name"
                    fullWidth
                    disabled={isSecondaryUserSelected}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="secondaryContact.position"
                    label="Position/Role"
                    fullWidth
                    disabled={isSecondaryUserSelected}
                  />
                </Grid>
                <Grid item xs={12} container spacing={1}>
                  <Grid item xs={8}>
                    <ControlledTextField
                      name="secondaryContact.workPhoneNumber"
                      mask="(000) 000-0000"
                      label="Work Phone Number"
                      fullWidth
                      disabled={isSecondaryUserSelected}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <ControlledTextField
                      name="secondaryContact.extensionNumber"
                      mask="0000"
                      label="Ext."
                      fullWidth
                      disabled={isSecondaryUserSelected}
                    />
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <ControlledTextField
                    name="secondaryContact.workEmailAddress"
                    label="Work Email Address"
                    fullWidth
                    disabled={isSecondaryUserSelected}
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
