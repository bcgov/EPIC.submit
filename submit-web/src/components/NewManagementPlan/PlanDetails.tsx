import { TabBox } from "./TabBox";
import { NewManagementPlanForm } from "./types";
import { NewPlanDetails } from "./NewPlanDetails";
import { useManagementPlanForm } from "./formStore";
import { useAccount } from "@/store/accountStore";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { ExistingPlanDetails } from "./ExistingPlanDetails";
import { When } from "react-if";
import { useState } from "react";

type PlanDetailsProps = {
  onSubmit: (formData: NewManagementPlanForm) => void;
};

export const PlanDetails = ({ onSubmit }: PlanDetailsProps) => {
  const { formData } = useManagementPlanForm();
  const { accountId } = useAccount();
  const { data: accountProjects } = useGetAccountProjectsByAccount({
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
      <When condition={Boolean(existingPlan) && !newlyCreatedPlan}>
        <ExistingPlanDetails existingPlan={existingPlan} />
      </When>
      <When condition={!existingPlan}>
        <NewPlanDetails
          onSubmit={onSubmit}
          setNewlyCreatedPlan={setNewlyCreatedPlan}
        />
      </When>
    </TabBox>
  );
};
