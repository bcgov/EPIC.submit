import { TabBox } from "./TabBox";
import { NewManagementPlanForm } from "./types";
import { NewPlanDetails } from "./NewPlanDetails";
import { useManagementPlanForm } from "./formStore";
import { useAccount } from "@/store/accountStore";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { ExistingPlanDetails } from "./ExistingPlanDetails";
import { Else, If, Then, When } from "react-if";
import { useState } from "react";
import { CircularProgress, Grid } from "@mui/material";

type PlanDetailsProps = {
  onSubmit: (formData: NewManagementPlanForm) => void;
};

export const PlanDetails = ({ onSubmit }: PlanDetailsProps) => {
  const { formData } = useManagementPlanForm();
  const { accountId } = useAccount();
  const { data: accountProjects, isLoading } = useGetAccountProjectsByAccount({
    accountId,
  });
  const [newlyCreatedPlan, setNewlyCreatedPlan] = useState(false);

  const existingPlan = accountProjects
    ?.flatMap((project) => project.packages)
    .find(
      (pkg) =>
        pkg?.meta?.main_condition?.condition_number ===
        formData?.main_condition?.condition_number
    );

  return (
    <TabBox title="Create New Submission">
      <If condition={isLoading}>
        <Then>
          <Grid
            container
            sx={{
              padding: "16px 0px",
            }}
            spacing={3}
          >
            <Grid item xs={12}>
              <CircularProgress size={40} />
            </Grid>
          </Grid>
        </Then>
        <Else>
          <When condition={Boolean(existingPlan) && !newlyCreatedPlan}>
            <ExistingPlanDetails existingPlan={existingPlan} />
          </When>
          <When condition={!existingPlan}>
            <NewPlanDetails
              onSubmit={onSubmit}
              setNewlyCreatedPlan={setNewlyCreatedPlan}
            />
          </When>
        </Else>
      </If>
    </TabBox>
  );
};
