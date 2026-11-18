import { Grid } from "@mui/material";
import { NewSubmissionCard } from "../NewSubmissionCard";
import { NewWorkPackageSubmissionForm } from "./NewWorkPackageSubmissionForm";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";
import { getSubmissionPhaseStatus } from "@/components/Shared/ProjectStatus/constants";

type NewWorkPackageSubmissionProps = {
  onSubmit: (data: any) => void;
};

export function NewWorkPackageSubmission({ onSubmit }: NewWorkPackageSubmissionProps) {
  const { accountProject, currentPhase, currentPhaseLabel } =
    useNewSubmissionStore();

  return (
    <Grid size={12}>
      <NewSubmissionCard
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent?.name}
        bottomLabel={
          accountProject?.project.ea_certificate &&
          `EAC # ${accountProject?.project.ea_certificate}`
        }
        status={
          currentPhaseLabel
            ? getSubmissionPhaseStatus(
                currentPhaseLabel,
                currentPhase?.name ?? "",
              )
            : undefined
        }
        barTitle="Select Submission"
      >
        <NewWorkPackageSubmissionForm onSubmit={onSubmit} />
      </NewSubmissionCard>
    </Grid>
  );
}
