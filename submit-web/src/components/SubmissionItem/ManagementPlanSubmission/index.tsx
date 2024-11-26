import { Case, Switch } from "react-if";
import { useAccount } from "@/store/accountStore";
import { USER_TYPE } from "@/models/User";
import { ManagementPlanSubmissionProponentView } from "./ManagementPlanProponentView";
import { ManagementPlanSubmissionStaffView } from "./ManagementPlanStaffView";

export const ManagementPlanSubmission = () => {
  const { userType } = useAccount();
  return (
    <Switch>
      <Case condition={userType === USER_TYPE.PROPONENT}>
        <ManagementPlanSubmissionProponentView />
      </Case>
      <Case condition={userType === USER_TYPE.STAFF}>
        <ManagementPlanSubmissionStaffView />
      </Case>
    </Switch>
  );
};
