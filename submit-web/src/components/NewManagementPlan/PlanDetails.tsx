import { TabBox } from "./TabBox";
import { NewManagementPlanForm } from "./types";
import { NewPlanDetails } from "./NewPlanDetails";
import { useManagementPlanForm } from "./formStore";
import { useAccount } from "@/store/accountStore";
import { useGetAccountProjectsByAccount } from "@/hooks/api/useProjects";
import { ExistingPlanDetails } from "./ExistingPlanDetails";
import { When } from "react-if";

type PlanDetailsProps = {
  onSubmit: (formData: NewManagementPlanForm) => void;
};

export const PlanDetails = ({ onSubmit }: PlanDetailsProps) => {
  const { formData } = useManagementPlanForm();
  const { accountId } = useAccount();
  const { data: accountProjects } = useGetAccountProjectsByAccount({
    accountId: 1,
  });

  const existingPlan = accountProjects
    ?.flatMap((project) => project.packages)
    .find(
      (pkg) =>
        pkg?.meta?.main_condition?.condition_number ===
        formData?.main_condition?.condition_number
    );

  return (
    <TabBox title="Plan Details">
      <When condition={Boolean(existingPlan)}>
        <ExistingPlanDetails existingPlan={existingPlan} />
      </When>
      <When condition={!existingPlan}>
        <NewPlanDetails onSubmit={onSubmit} />
      </When>
    </TabBox>
  );
};
