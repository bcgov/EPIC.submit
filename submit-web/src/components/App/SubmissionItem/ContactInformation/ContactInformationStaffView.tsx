import { Button, Grid, TextField, Typography } from "@mui/material";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SubmissionFormContainer } from "@/components/App/SubmissionItem/SubmissionFormContainer";
import { QUERY_KEY } from "@/hooks/api/constants";
import { get } from "lodash";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";
import { useGetAccountUserById } from "@/hooks/api/useAccountUsers";
import { useMemo } from "react";
import { useGetStaffSubmissionPackage } from "@/hooks/api/usePackages";
import { useContactInfoAlwaysEditable } from "@/hooks/useContactInfoAlwaysEditable";
import { ContactInformationEntityView } from "./ContactInformationEntityView";

export const ContactInformationStaffView = () => {
  const {
    projectId: accountProjectIdParam,
    submissionPackageId,
    submissionId,
  } = useParams({
    from: "/staff/_staffLayout/projects/$projectId/_projectLayout/submission-packages/$submissionPackageId/_submissionLayout/submissions/$submissionId",
  });

  const queryClient = useQueryClient();
  const submissionItem = queryClient.getQueryData<SubmissionItem>([
    QUERY_KEY.SUBMISSION_ITEM,
    Number(submissionId),
  ]);
  const accountProjectId = Number(accountProjectIdParam);
  const { data: accountProject } = useGetAccountProjectForStaff({
    accountProjectId,
  });

  const { data: submissionPackage } = useGetStaffSubmissionPackage({
    packageId: Number(submissionPackageId),
  });

  // Staff can edit contact information on the latest version of a package,
  // in any status. Otherwise the historical read-only view is shown.
  const isEditable = useContactInfoAlwaysEditable({
    item: submissionItem,
    submissionPackage,
  });

  const navigate = useNavigate();

  const formSubmission = submissionItem?.submissions.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM,
  );

  const contactInfo = formSubmission?.submitted_form?.submission_json;

  const primaryContactUserId = get(contactInfo, "primaryContact.accountUserId");
  const secondaryContactUserId = get(
    contactInfo,
    "secondaryContact.accountUserId",
  );

  const { data: primaryUser } = useGetAccountUserById({
    accountUserId: primaryContactUserId
      ? Number(primaryContactUserId)
      : undefined,
  });

  const { data: secondaryUser } = useGetAccountUserById({
    accountUserId: secondaryContactUserId
      ? Number(secondaryContactUserId)
      : undefined,
  });

  const primaryContactData = useMemo(() => {
    return {
      givenName:
        primaryUser?.first_name ??
        get(contactInfo, "primaryContact.givenName", ""),
      surname:
        primaryUser?.last_name ??
        get(contactInfo, "primaryContact.surname", ""),
      company:
        primaryUser?.company_name ??
        get(contactInfo, "primaryContact.company", ""),
      position:
        primaryUser?.position ??
        get(contactInfo, "primaryContact.position", ""),
      workPhoneNumber:
        primaryUser?.work_contact_number ??
        get(contactInfo, "primaryContact.workPhoneNumber", ""),
      extensionNumber:
        primaryUser?.extension_number ??
        get(contactInfo, "primaryContact.extensionNumber", ""),
      workEmailAddress:
        primaryUser?.work_email_address ??
        get(contactInfo, "primaryContact.workEmailAddress", ""),
    };
  }, [primaryUser, contactInfo]);

  const secondaryContactData = useMemo(() => {
    return {
      givenName:
        secondaryUser?.first_name ??
        get(contactInfo, "secondaryContact.givenName", ""),
      surname:
        secondaryUser?.last_name ??
        get(contactInfo, "secondaryContact.surname", ""),
      company:
        secondaryUser?.company_name ??
        get(contactInfo, "secondaryContact.company", ""),
      position:
        secondaryUser?.position ??
        get(contactInfo, "secondaryContact.position", ""),
      workPhoneNumber:
        secondaryUser?.work_contact_number ??
        get(contactInfo, "secondaryContact.workPhoneNumber", ""),
      extensionNumber:
        secondaryUser?.extension_number ??
        get(contactInfo, "secondaryContact.extensionNumber", ""),
      workEmailAddress:
        secondaryUser?.work_email_address ??
        get(contactInfo, "secondaryContact.workEmailAddress", ""),
    };
  }, [secondaryUser, contactInfo]);

  const handleCancel = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };

  if (isEditable) {
    return <ContactInformationEntityView variant="staff" />;
  }

  if (!accountProject) return <Navigate to="/error" />;

  return (
    <SubmissionFormContainer>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <BarBlueTitle title="Submission Contact Information" />
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
            <TextField
              name="primaryContact.givenName"
              label="Given Name"
              fullWidth
              value={primaryContactData.givenName}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.surname"
              label="Surname"
              fullWidth
              value={primaryContactData.surname}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.company"
              label="Company Name"
              fullWidth
              value={primaryContactData.company}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.position"
              label="Position/Role"
              fullWidth
              value={primaryContactData.position}
            />
          </Grid>
          <Grid item xs={12} container spacing={1}>
            <Grid item xs={8}>
              <TextField
                value={String(primaryContactData.workPhoneNumber)}
                fullWidth
                label="Work Phone Number"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                value={String(primaryContactData.extensionNumber)}
                fullWidth
                label="Ext."
              />
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.workEmailAddress"
              label="Work Email Address"
              fullWidth
              value={primaryContactData.workEmailAddress}
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
              <TextField
                name="secondaryContact.givenName"
                label="Given Name"
                fullWidth
                value={secondaryContactData.givenName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.surname"
                label="Surname"
                fullWidth
                value={secondaryContactData.surname}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.company"
                label="Company Name"
                fullWidth
                value={secondaryContactData.company}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.position"
                label="Position/Role"
                fullWidth
                value={secondaryContactData.position}
              />
            </Grid>
            <Grid item xs={12} container spacing={1}>
              <Grid item xs={8}>
                <TextField
                  value={String(secondaryContactData.workPhoneNumber)}
                  fullWidth
                  label="Work Phone Number"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  value={String(secondaryContactData.extensionNumber)}
                  fullWidth
                  label="Ext."
                />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.workEmailAddress"
                label="Work Email Address"
                fullWidth
                value={secondaryContactData.workEmailAddress}
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
        </Grid>
      </Grid>
    </SubmissionFormContainer>
  );
};
