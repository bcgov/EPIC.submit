import { Button, Grid, TextField, Typography } from "@mui/material";
import { Navigate, useNavigate, useParams } from "@tanstack/react-router";
import { SUBMISSION_TYPE } from "@/models/Submission";
import { useGetAccountProjectForStaff } from "@/hooks/api/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { SubmissionItem } from "@/models/SubmissionItem";
import { SubmissionFormContainer } from "../SubmissionFormContainer";
import { QUERY_KEY } from "@/hooks/api/constants";
import { get } from "lodash";
import { BarBlueTitle } from "@/components/Shared/Text/BarTitle";

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

  const navigate = useNavigate();

  const formSubmission = submissionItem?.submissions.find(
    (submission) => submission.type === SUBMISSION_TYPE.FORM
  );

  const handleCancel = () => {
    navigate({
      to: `/staff/projects/${accountProjectId}/submission-packages/${submissionPackageId}`,
    });
  };

  const contactInfo = formSubmission?.submitted_form?.submission_json;

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
              value={get(contactInfo, "primaryContact.givenName")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.surname"
              label="Surname"
              fullWidth
              value={get(contactInfo, "primaryContact.surname")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.company"
              label="Company Name"
              fullWidth
              value={get(contactInfo, "primaryContact.company")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="primaryContact.position"
              label="Position/Role"
              fullWidth
              value={get(contactInfo, "primaryContact.position")}
            />
          </Grid>
          <Grid item xs={12} container spacing={1}>
            <Grid item xs={8}>
              <TextField
                value={String(
                  get(contactInfo, "primaryContact.workPhoneNumber", "")
                )}
                fullWidth
                label="Work Phone Number"
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                value={String(
                  get(contactInfo, "primaryContact.extensionNumber", "")
                )}
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
              value={get(contactInfo, "primaryContact.workEmailAddress")}
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
                value={get(contactInfo, "secondaryContact.givenName")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.surname"
                label="Surname"
                fullWidth
                value={get(contactInfo, "secondaryContact.surname")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.company"
                label="Company Name"
                fullWidth
                value={get(contactInfo, "secondaryContact.company")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="secondaryContact.position"
                label="Position/Role"
                fullWidth
                value={get(contactInfo, "secondaryContact.position")}
              />
            </Grid>
            <Grid item xs={12} container spacing={1}>
              <Grid item xs={8}>
                <TextField
                  value={String(
                    get(contactInfo, "secondaryContact.workPhoneNumber", "")
                  )}
                  fullWidth
                  label="Work Phone Number"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  value={String(
                    get(contactInfo, "secondaryContact.extensionNumber", "")
                  )}
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
                value={get(contactInfo, "secondaryContact.workEmailAddress")}
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
