import { Form } from "@/components/App/NewSubmission/NewManagementPlan/Form";
import { NewManagementPlanForm } from "@/components/App/NewSubmission/NewManagementPlan/types";
import { PROJECT_STATUS } from "@/components/Shared/ProjectStatus";
import { SubmissionPackageType } from "@/models/Package";
import { Grid } from "@mui/material";
import { NewSubmissionCard } from "../NewSubmissionCard";
import { useNewSubmissionStore } from "@/store/newSubmissionStore";

type NewManagementPlanProps = {
  onSubmit: (data: Record<string, unknown>) => void;
};

export function NewManagementPlan({ onSubmit }: NewManagementPlanProps) {
  const { accountProject } = useNewSubmissionStore();

  const handleSubmit = ({
    name,
    type,
    ...restMetadata
  }: Partial<NewManagementPlanForm>) => {
    onSubmit({
      name: name?.value ?? SubmissionPackageType.MANAGEMENT_PLAN,
      metadata: restMetadata,
      type,
    });
  };

  return (
    <Grid item xs={12}>
      <NewSubmissionCard
        mainLabel={accountProject?.project.name}
        topLabel={accountProject?.project?.proponent?.name}
        bottomLabel={
          accountProject?.project.ea_certificate &&
          `EAC # ${accountProject?.project.ea_certificate}`
        }
        submissionName="Management Plans & Related Documents"
        status={PROJECT_STATUS.POST_DECISION}
      >
        <Form onSubmit={handleSubmit} />
      </NewSubmissionCard>
    </Grid>
  );
}
