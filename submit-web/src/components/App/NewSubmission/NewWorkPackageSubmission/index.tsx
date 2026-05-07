import { Grid } from "@mui/material";
import { NewSubmissionCard } from "../NewSubmissionCard";
import { NewWorkPackageSubmissionForm } from "./NewWorkPackageSubmissionForm";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";

type NewWorkPackageSubmissionProps = {
  onSubmit: (data: any) => void;
};

export function NewWorkPackageSubmission({ onSubmit }: NewWorkPackageSubmissionProps) {
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
        <NewWorkPackageSubmissionForm onSubmit={onSubmit} />
      </NewSubmissionCard>
    </Grid>
  );
}
