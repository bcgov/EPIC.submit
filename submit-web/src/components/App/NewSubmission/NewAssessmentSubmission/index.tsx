import { Grid } from "@mui/material";
import { NewSubmissionCard } from "../NewSubmissionCard";
import { NewAssessmentSubmissionForm } from "./NewAssessmentSubmissionForm";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";

export function NewAssessmentSubmission() {
  const { accountProject } = useNewSubmissionStore();

  return (
    <Grid item xs={12}>
      <NewSubmissionCard
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent?.name}
        bottomLabel={
          accountProject?.project.ea_certificate &&
          `EAC # ${accountProject?.project.ea_certificate}`
        }
        barTitle="Select Submission"
      >
        <NewAssessmentSubmissionForm />
      </NewSubmissionCard>
    </Grid>
  );
}
