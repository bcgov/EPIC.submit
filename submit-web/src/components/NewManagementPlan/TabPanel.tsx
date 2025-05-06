import { Case, Switch } from "react-if";
import { useManagementPlanForm } from "./formStore";
import { MANAGEMENT_PLAN_FORM_STEPS } from "./constants";
import { Box } from "@mui/material";
import { Conditions } from "./Conditions";
import { PlanDetails } from "./PlanDetails";
import { NewManagementPlanForm } from "./types";

type TabPanelProps = {
  onSubmit: (formData: Partial<NewManagementPlanForm>) => void;
};
export const TabPanel = ({ onSubmit }: TabPanelProps) => {
  const { step } = useManagementPlanForm();
  return (
    <Box>
      <Switch>
        <Case condition={step === MANAGEMENT_PLAN_FORM_STEPS.CONDITIONS}>
          <Conditions />
        </Case>
        <Case condition={step === MANAGEMENT_PLAN_FORM_STEPS.PLAN_DETAILS}>
          <PlanDetails onSubmit={onSubmit} />
        </Case>
      </Switch>
    </Box>
  );
};
