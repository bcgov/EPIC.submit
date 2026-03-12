import { Grid } from "@mui/material";
import { NewSubmissionCard } from "../NewSubmissionCard";
import { NewAssessmentSubmissionForm } from "./NewAssessmentSubmissionForm";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";

type NewAssessmentSubmissionProps = {
  onSubmit: (data: Record<string, unknown>) => void;
};

export function NewAssessmentSubmission({
  onSubmit,
}: NewAssessmentSubmissionProps) {
  const { accountProject } = useNewSubmissionStore();

  // const handleSubmit = ({
  //   name,
  //   type,
  //   ...restMetadata
  // }: Partial<NewAssessmentSubmissionForm>) => {
  //   onSubmit({
  //     name: name?.value ?? SubmissionPackageType.IPD,
  //     metadata: restMetadata,
  //     type,
  //   });
  // };

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
